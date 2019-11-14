import { useContext, useState } from "../hooks/hooks";
import React from "react";
import { box, log } from "../logger";

declare global {

  interface IScrollPosition {
    x: number;
    y: number;
  }

  interface IRenderState {
    readonly zoomFactor: number;
    readonly scrollPosition: IScrollPosition;
    readonly background: string;
  }

  export interface IRenderContext extends ReturnType<typeof useRenderState> { }

}

const initialState: IRenderState = {
  zoomFactor: 1,
  scrollPosition: { x: 0 , y: 0 },
  background: "transparent",
};

export const RenderContext = React.createContext<IRenderContext>({} as any);

function getBox() {
  return box("useRenderState", "#22f", "#fff");
}

export function useRenderState() {
  return useState<IRenderState>(initialState, "renderState");
}

export function useRenderContext() {
  const contextInfo = useContext(RenderContext);
  if (!contextInfo) throw new Error("No Render Context available, make sure a parent RenderProvider component is available");
  return contextInfo;
}

// Actions

export function setZoomFactor(state: IRenderState, zoomFactor: number) {
  log(getBox(), `Set zoom factor: ${zoomFactor}`);
  return {
    ...state,
    zoomFactor,
  };
}

export function setScrollPosition(state: IRenderState, scrollPosition: IScrollPosition) {
  log(getBox(), `Set scroll position: ${JSON.stringify(scrollPosition)}`);
  return {
    ...state,
    scrollPosition,
  };
}

export function setBackground(state: IRenderState, background: string) {
  log(getBox(), `Set background: ${background}`);
  return {
    ...state,
    background,
  };
}
