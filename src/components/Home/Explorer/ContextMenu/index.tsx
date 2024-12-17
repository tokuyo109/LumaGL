import { useEffect } from 'react';

type ContextMenuProps = {
  x: number;
  y: number;
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const ContextMenu = ({
  x,
  y,
  isVisible,
  onClose,
  children,
}: ContextMenuProps) => {
  useEffect(() => {
    const handleClickOutside = () => {
      if (isVisible) onClose();
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}px`,
        left: `${x}px`,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        zIndex: 1000,
        padding: '5px',
      }}
    >
      {children}
    </div>
  );
};

export default ContextMenu;
