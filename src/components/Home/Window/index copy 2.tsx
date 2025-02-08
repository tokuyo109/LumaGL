import { useState, useEffect } from 'react';
import {
  IJsonModel,
  Model,
  Layout,
  TabNode,
  TabSetNode,
  BorderNode,
  Action,
  ITabSetRenderValues,
  IJsonRowNode,
  IJsonTabSetNode,
  Node,
} from 'flexlayout-react';
import Preview from '../Preview';
import { useWindowContext } from './context';
import { takeExtension, takePathname } from '../Explorer/utils';
import { VscPlay } from 'react-icons/vsc';
import FlexLayoutIconButton from '../../UI/FlexLayoutIconButton';
import 'flexlayout-react/style/light.css';
import styles from './index.module.css';

// レイアウトの表示設定
const initialJsonModel: IJsonModel = {
  global: { tabEnablePopout: true },
  borders: [],
  layout: {
    type: 'row',
    children: [],
  },
};

/**
 * モデルに存在するキーを収集する関数
 */
const collectModelKeys = (node: any, result: Set<string>) => {
  if (node.type === 'tab') result.add(node.component);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectModelKeys(child, result);
    }
  }
};

const Window = () => {
  const { windows, setWindows } = useWindowContext();
  const [model, setModel] = useState<Model>(() =>
    Model.fromJson(initialJsonModel),
  );

  /**
   * タブの内容を生成する関数
   */
  const factory = (node: TabNode) => {
    const path = node.getComponent();
    const content = path && windows.get(path);
    return path && content ? (
      <div className={styles.tabNode}>
        {/* <div>{path}</div> */}
        {content}
      </div>
    ) : undefined;
  };

  /**
   * タブの選択や削除などの操作に応じて実行される関数
   */
  const handleAction = (action: Action) => {
    // 削除ボタン押下時
    if (action.type === 'FlexLayout_DeleteTab') {
      const nodeId: string = action.data.node;
      const node: Node | undefined = model.getNodeById(nodeId);
      if (node instanceof TabNode) {
        const path: string | undefined = node.getComponent();
        path &&
          setWindows((prev) => {
            const newMap = new Map(prev);
            newMap.delete(path);
            return newMap;
          });
      }
    }
    return action;
  };

  /**
   * タブグループにボタンを追加する関数
   */
  const onRenderTabSet = (
    tabSetNode: TabSetNode | BorderNode,
    renderValues: ITabSetRenderValues,
  ) => {
    const selectedNode: Node | undefined = tabSetNode.getSelectedNode();
    if (selectedNode instanceof TabNode) {
      const path = selectedNode.getComponent();
      const extension = takeExtension(path ?? '');

      path &&
        extension === 'html' &&
        renderValues.buttons.push(
          <FlexLayoutIconButton
            key={path}
            onClick={() => {
              setWindows((prev) => {
                return new Map(prev).set(
                  path + ':preview',
                  <Preview path={path} update_at={Date.now()}></Preview>,
                );
              });
            }}
          >
            <VscPlay />
          </FlexLayoutIconButton>,
        );
    }
  };

  // windowsが変更されたとき差分をmodelに反映させる
  useEffect(() => {
    const jsonModel: IJsonModel = model.toJson();
    const layout: IJsonRowNode = jsonModel.layout;

    const modelKeys: Set<string> = new Set();
    collectModelKeys(layout, modelKeys);
    const windowsKeys: string[] = Array.from(windows.keys());

    const toAdd: string[] = windowsKeys.filter((k) => !modelKeys.has(k));
    toAdd.forEach((key) => {
      const tabset: IJsonTabSetNode = {
        type: 'tabset',
        children: [
          {
            type: 'tab',
            name: takePathname(key),
            component: key,
            className: styles.tab,
          },
        ],
      };
      layout.children.push(tabset);
    });

    const newModel: Model = Model.fromJson(jsonModel);
    setModel(newModel);
  }, [windows]);

  if (!windows.size)
    return <div className={styles.renderZero}>何も選択されていません</div>;
  return (
    <div className={styles.window}>
      <Layout
        model={model}
        factory={factory}
        onAction={handleAction}
        onRenderTabSet={onRenderTabSet}
      ></Layout>
    </div>
  );
};

export default Window;
