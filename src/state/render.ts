import { useContext, useReducer } from "../hooks/hooks";
import React from "react";
import { box, log } from "../logger";

declare global {

  interface IRenderReducerActions {
    "INCREASE_ZOOM": { type: "INCREASE_ZOOM"};
    "DECREASE_ZOOM": { type: "DECREASE_ZOOM"};
    "SET_SCROLLPOSITION": { type: "SET_SCROLLPOSITION", scrollPosition: IScrollPosition};
    "SET_BACKGROUND": { type: "SET_BACKGROUND", background: string };
    "SET_EFFECT": { type: "SET_EFFECT", effectName: string };
  }

  type IRenderAction = IRenderReducerActions[keyof IRenderReducerActions];

  interface IScrollPosition {
    x: number;
    y: number;
  }

  interface IRenderState {
    readonly zoomFactor: number;
    readonly scrollPosition: IScrollPosition;
    readonly background: string;
    readonly effectName: string;
  }

  export interface IRenderContext extends ReturnType<typeof useRenderState> { }

}

const initialState: IRenderState = {
  zoomFactor: 1,
  scrollPosition: { x: 0 , y: 0 },
  background: "transparent",
  effectName: "",
};

export const RenderContext = React.createContext<IRenderContext>({} as any);

function getBox() {
  return box("useRenderState", "#22f", "#fff");
}

export function useRenderState() {
  return useReducer(renderReducer, initialState);
}

export function useRenderContext() {
  const contextInfo = useContext(RenderContext);
  if (!contextInfo) throw new Error("No Render Context available, make sure a parent RenderProvider component is available");
  return contextInfo;
}

// Actions

function setZoomFactor(state: IRenderState, zoomFactor: number) {

  // TODO, also scale scroll position, use % or ratio?
  return {
    ...state,
    zoomFactor,
  };
}

function setScrollPosition(state: IRenderState, scrollPosition: IScrollPosition) {
  log(getBox(), `Set scroll position: ${JSON.stringify(scrollPosition)}`);
  return {
    ...state,
    scrollPosition,
  };
}

function setBackground(state: IRenderState, background: string) {
  log(getBox(), `Set background: ${background}`);
  return {
    ...state,
    background,
  };
}

function setEffectName(state: IRenderState, effectName: string) {
  log(getBox(), `Set effect: ${effectName}`);
  return {
    ...state,
    effectName,
  };
}

// Reducer
function renderReducer(state: IRenderState, action: IRenderAction) {
  switch (action.type) {
    case "INCREASE_ZOOM": return setZoomFactor(state, state.zoomFactor * 1.5);
    case "DECREASE_ZOOM": return setZoomFactor(state, state.zoomFactor / 1.5);
    case "SET_SCROLLPOSITION": return setScrollPosition(state, action.scrollPosition);
    case "SET_BACKGROUND": return setBackground(state, action.background);
    case "SET_EFFECT": return setEffectName(state, action.effectName);
    default:
      // exhaustiveFail(action.type);
      return state;
  }
}
