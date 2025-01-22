import { useState, useEffect } from 'react';
import {
  IJsonModel,
  Model,
  Layout,
  IJsonRowNode,
  IJsonTabSetNode,
  TabNode,
  Action,
} from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { useWindowContext } from './context';
import styles from './index.module.css';

const initialJsonModel: IJsonModel = {
  global: { tabEnablePopout: true },
  borders: [],
  layout: {
    type: 'row',
    children: [],
  },
};

/**
 * モデルに存在するキーを収集する
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

  // タブの中身を生成する処理
  const factory = (node: TabNode) => {
    const key = node.getComponent();
    if (!key) return;

    const content = windows.get(key);
    if (!content) return;

    return <>{content}</>;
  };

  const handleAction = (action: Action) => {
    // 削除ボタンクリック時に削除
    if (action.type === 'FlexLayout_DeleteTab') {
      const nodeId: string = action.data.node;
      const tabNode = model.getNodeById(nodeId) as TabNode;
      if (!tabNode) return;

      const key = tabNode.getComponent();
      if (!key) return;

      setWindows((prev) => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }
    return action;
  };

  // windowsが変更されたとき差分をmodelに反映させる
  useEffect(() => {
    const jsonModel: IJsonModel = model.toJson();
    const layout: IJsonRowNode = jsonModel.layout;

    const modelKeys: Set<string> = new Set(); // モデルのキー配列
    collectModelKeys(layout, modelKeys); // モデルのキーを収集して配列に追加するする
    const windowsKeys: string[] = Array.from(windows.keys()); // 現在のキー配列

    const toAdd: string[] = windowsKeys.filter((k) => !modelKeys.has(k)); // 追加されたキー配列
    toAdd.forEach((key) => {
      const tabset: IJsonTabSetNode = {
        type: 'tabset',
        children: [
          {
            type: 'tab',
            name: key,
            component: key,
          },
        ],
      };
      layout.children.push(tabset);
    });

    const newModel: Model = Model.fromJson(jsonModel);
    setModel(newModel);
  }, [windows]);

  if (!windows.size) return <p>何も選択されていません</p>;
  return (
    <div className={styles.window}>
      <Layout model={model} factory={factory} onAction={handleAction}></Layout>;
    </div>
  );
};

export default Window;
