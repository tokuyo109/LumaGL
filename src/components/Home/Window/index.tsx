import { useRef, useEffect } from 'react';
import {
  Layout,
  TabNode,
  TabSetNode,
  IJsonRowNode,
  IJsonTabNode,
  // IJsonTabSetNode,
  ITabSetRenderValues,
  IJsonModel,
  Model,
  Action,
  Actions,
  DockLocation,
  Node,
  BorderNode,
} from 'flexlayout-react';
import { VscPlay } from 'react-icons/vsc';
import { useWindowContext } from './context';
import { takeExtension, takePathname } from '../Explorer/utils';
import FlexLayoutIconButton from '../../UI/FlexLayoutIconButton';
import Preview from '../Preview';

import 'flexlayout-react/style/light.css';
import styles from './index.module.css';

const initialJsonModel: IJsonModel = {
  global: {},
  borders: [],
  layout: {
    type: 'row',
    children: [
      {
        type: 'tabset',
        children: [],
      },
    ],
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
  const modelRef = useRef<Model>(Model.fromJson(initialJsonModel));
  const { windows, setWindows } = useWindowContext();

  /**
   * タブの選択や削除などの操作に応じて実行される関数
   */
  const handleAction = (action: Action) => {
    // 削除ボタン押下時
    if (action.type === 'FlexLayout_DeleteTab') {
      const model = modelRef.current;
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
                  // path + ':preview',
                  'プレビュー',
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

  const factory = (node: TabNode) => {
    const path = node.getComponent();
    const content = path && windows.get(path);
    return path && content ? (
      <div className={styles.tabNode}>{content}</div>
    ) : undefined;
  };

  useEffect(() => {
    const model = modelRef.current;
    const jsonModel: IJsonModel = model.toJson();
    const layout: IJsonRowNode = jsonModel.layout;

    const modelKeys: Set<string> = new Set();
    collectModelKeys(layout, modelKeys);
    const windowsKeys: string[] = Array.from(windows.keys());

    const toAdd: string[] = windowsKeys.filter((k) => !modelKeys.has(k));
    toAdd.forEach((key) => {
      const tab: IJsonTabNode = {
        type: 'tab',
        name: takePathname(key),
        component: key,
        className: styles.tab,
      };

      let targetId: string | null = null;
      const active = model.getActiveTabset();
      if (active) {
        targetId = active.getId();
      } else {
        const root = model.getRoot();
        const target = root.getChildren()[0] as TabSetNode;
        targetId = target.getId();
      }
      const addAction = Actions.addNode(tab, targetId, DockLocation.CENTER, 1);
      const tabNode = model.doAction(addAction) as TabNode;
      const tabNodeId = tabNode.getId();
      const selectAction = Actions.selectTab(tabNodeId);
      model.doAction(selectAction);
    });
  }, [windows]);

  if (!windows.size)
    return <div className={styles.renderZero}>何も選択されていません</div>;
  return (
    <div className={styles.window}>
      <Layout
        model={modelRef.current}
        factory={factory}
        onAction={handleAction}
        onRenderTabSet={onRenderTabSet}
      ></Layout>
    </div>
  );
};

export default Window;
