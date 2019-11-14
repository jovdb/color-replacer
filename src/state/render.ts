import { useContext, useState } from "../hooks/hooks";
import React, { useReducer } from "react";
import { box, log } from "../logger";

declare global {

  interface IGroupReducerActions {
    "INCREASE_ZOOM": { type: "INCREASE_ZOOM"};
    "DECREASE_ZOOM": { type: "DECREASE_ZOOM"};
    "SET_SCROLLPOSITION": { type: "SET_SCROLLPOSITION", scrollPosition: IScrollPosition};
    "SET_BACKGROUND": { type: "SET_BACKGROUND", background: string };
  }

  type IGroupAction = IGroupReducerActions[keyof IGroupReducerActions];

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
  return useReducer(reducer, initialState);
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

// Reducer
function reducer(state: IRenderState, action: IGroupAction) {
  switch (action.type) {
    case "INCREASE_ZOOM": return setZoomFactor(state, state.zoomFactor * 1.5);
    case "DECREASE_ZOOM": return setZoomFactor(state, state.zoomFactor / 1.5);
    case "SET_SCROLLPOSITION": return setScrollPosition(state, action.scrollPosition);
    case "SET_BACKGROUND": return setBackground(state, action.background);
    default:
      // exhaustiveFail(action.type);
      return state;
  }
}
