import { useState } from 'react';
import { useDroppable, useDraggable, DndContext } from '@dnd-kit/core';

const Draggable = (props) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'draggable',
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
};

const Droppable = () => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable',
  });

  const style = {
    color: isOver ? 'green' : 'undefined',
  };

  return (
    <div ref={setNodeRef} style={style}>
      Droppable
    </div>
  );
};

const Test = () => {
  const [isDropped, setIsDropped] = useState(false);
  const draggableMarkup = <Draggable>Drag me</Draggable>;

  const handleDragEnd = (event) => {
    if (event.over && event.over.id === 'droppable') {
      setIsDropped(true);
    }
  };

  return (
    <>
      <DndContext onDragEnd={handleDragEnd}>
        {!isDropped ? draggableMarkup : null}
        <Droppable>{isDropped ? draggableMarkup : 'Drop here'}</Droppable>
      </DndContext>
    </>
  );
};

export default Test;
