declare module "react-svg-pan-zoom" {
  import * as React from "react";

  export type Tool = "pan" | "zoom" | "none" | "auto";

  export interface Value {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  }

  export interface ReactSVGPanZoomProps {
    width: number;
    height: number;
    tool?: Tool;
    onChangeTool?: (tool: Tool) => void;
    value?: Value;
    onChangeValue?: (value: Value) => void;
    detectAutoPan?: boolean;
    miniatureProps?: {
      position?: "none" | "left" | "right";
      width?: number;
      height?: number;
    };
    toolbarProps?: {
      position?: "none" | "top" | "right" | "bottom" | "left";
    };
    children: React.ReactNode;
  }

  export class ReactSVGPanZoom extends React.Component<ReactSVGPanZoomProps> {
    panOnViewerCenter(): void;
    zoomOnViewerCenter(scaleFactor: number): void;
    fitToViewer(): void;
    setPointOnViewerCenter(x: number, y: number, zoom: number): void;
    reset(): void;
  }

  export const TOOL_AUTO: "auto";
  export const TOOL_NONE: "none";
  export const TOOL_PAN: "pan";
  export const TOOL_ZOOM: "zoom";
}
