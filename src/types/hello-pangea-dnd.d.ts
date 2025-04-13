declare module '@hello-pangea/dnd' {
  import * as React from 'react';

  // DragDropContext
  export interface DragDropContextProps {
    onDragEnd: (result: DropResult, provided: DragDropContextProvided) => void;
    onDragStart?: (initial: DragStart, provided: DragDropContextProvided) => void;
    onDragUpdate?: (initial: DragUpdate, provided: DragDropContextProvided) => void;
    children?: React.ReactNode;
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: DraggableLocation;
  }

  export interface DragUpdate extends DragStart {
    destination?: DraggableLocation;
  }

  export interface DropResult extends DragUpdate {
    reason: 'DROP' | 'CANCEL';
  }

  export interface DraggableLocation {
    droppableId: string;
    index: number;
  }

  export interface DragDropContextProvided {
    announce: (message: string) => void;
  }

  export declare class DragDropContext extends React.Component<DragDropContextProps> {}

  // Droppable
  export interface DroppableProps {
    droppableId: string;
    type?: string;
    isDropDisabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    ignoreContainerClipping?: boolean;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: {
      'data-rbd-droppable-id': string;
      'data-rbd-droppable-context-id': string;
    };
    placeholder?: React.ReactNode;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
    draggingFromThisWith?: string;
  }

  export declare class Droppable extends React.Component<DroppableProps> {}

  // Draggable
  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubric: DraggableRubric) => React.ReactNode;
  }

  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => void;
    draggableProps: {
      'data-rbd-draggable-context-id': string;
      'data-rbd-draggable-id': string;
      style?: React.CSSProperties;
    };
    dragHandleProps?: {
      'data-rbd-drag-handle-draggable-id': string;
      'data-rbd-drag-handle-context-id': string;
      'aria-describedby': string;
      role: string;
      tabIndex: number;
      draggable: boolean;
      onDragStart: (event: React.DragEvent<HTMLElement>) => void;
    };
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    dropAnimation?: {
      duration: number;
      curve: string;
    };
    draggingOver?: string;
    combineWith?: string;
    combineTargetFor?: string;
    mode?: 'FLUID' | 'SNAP';
  }

  export interface DraggableRubric {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
  }

  export declare class Draggable extends React.Component<DraggableProps> {}
} 