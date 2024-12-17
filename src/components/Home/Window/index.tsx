import { Mosaic, MosaicNode, MosaicWindow } from 'react-mosaic-component';
import { useExplorerContext } from '../Explorer/context';
import { useWindowContext } from './context';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import IconButton from '../../UI/IconButton';
import 'react-mosaic-component/react-mosaic-component.css';
import { findNodeById } from '../Explorer/utils';

const Window = () => {
  const { tree } = useExplorerContext();
  const { mosaicState, setMosaicState } = useWindowContext();

  const initialLayout: MosaicNode<string> | null = Object.keys(
    mosaicState,
  ).reduce<MosaicNode<string> | null>((prev, curr) => {
    if (!prev) return curr;
    return {
      direction: 'row',
      first: prev,
      second: curr,
      splitPercentage: 50,
    };
  }, null);

  const handlePreview = async (id: string) => {
    const path = findNodeById(tree, id);
    const node = path?.slice(-1)[0];
    if (!node) return;

    const handle = node.handle as FileSystemFileHandle;
    const file = await handle.getFile();
    const html = await file.text();

    // baseタグを挿入することでBlobでも相対パスでリクエストが使える
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const baseTag = `<base href="${baseUrl}">`;
    const modifiedHTML = html.replace(/<head>/i, `<head>${baseTag}`);

    const blob = new Blob([modifiedHTML], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    // Blob URLの開放
    const cleanup = () => URL.revokeObjectURL(blobUrl);

    setMosaicState((prev) => ({
      ...prev,
      [`${id}: Preview`]: (
        <iframe
          src={blobUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={cleanup}
          onError={cleanup}
        ></iframe>
      ),
    }));
  };

  const handleRemoveTile = (id: string) => {
    setMosaicState((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  return (
    <Mosaic<string>
      renderTile={(id, path) => {
        const toolbarControls = [
          <IconButton
            key="delete"
            label="タイルの削除"
            onClick={() => handleRemoveTile(id)}
          >
            <XMarkIcon />
          </IconButton>,
        ];

        if (id.endsWith('.html')) {
          toolbarControls.push(
            <IconButton
              key="preview"
              label="プレビュー"
              onClick={() => handlePreview(id)}
            >
              <PlayIcon />
            </IconButton>,
          );
        }

        return (
          <MosaicWindow<string>
            title={id}
            path={path}
            key={id}
            toolbarControls={toolbarControls}
          >
            {mosaicState[id]}
          </MosaicWindow>
        );
      }}
      initialValue={initialLayout}
    />
  );
};

export default Window;
