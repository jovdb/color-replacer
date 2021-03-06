import { useContext, useReducer } from "../hooks/hooks";
import React from "react";

interface IGroupReducerActions {
  "ADD_GROUP": { type: "ADD_GROUP", group: Readonly<IGroup> };
  "DELETE_GROUP": { type: "DELETE_GROUP", deleteIndex?: number };
  "REPLACE_GROUP": { type: "REPLACE_GROUP", replaceIndex?: number, group: Readonly<IGroup> };
  "MOVE_GROUP": { type: "MOVE_GROUP", fromIndex?: number; toIndex: number };
  "REPLACE_GROUPS": { type: "REPLACE_GROUPS", groups: ReadonlyArray<Readonly<IGroup>>, selectIndex?: number };
  "SELECT_GROUP": { type: "SELECT_GROUP", selectIndex: number };
  "HOVER_GROUP": { type: "HOVER_GROUP", hoverIndex: number };
}

type IGroupAction = IGroupReducerActions[keyof IGroupReducerActions];

declare global {

  type MixMethod = "fixed" | "clip" | "linear" | "curve";

  interface IGroup {
    hue: number;
    hueMin: number;
    hueMax: number;
    satMin: number;
    satMax: number;
    satMethod: MixMethod;

    lumMin: number;
    lumMax: number;
    lumMethod: MixMethod;

    sourceColor?: string;
    targetColor?: string;
  }

  interface IGroupState {
    readonly groups: readonly IGroup[];
    readonly selectedIndex: number;
    readonly hoveredIndex: number;
  }

  export interface IGroupsContext extends ReturnType<typeof useGroupsState> { }

}

const initialState: IGroupState = {
  groups: [],
  selectedIndex: -1,
  hoveredIndex: -1,
};

export const GroupsContext = React.createContext<IGroupsContext>({} as any);


export function useGroupsState() {
  return useReducer(groupsReducer, initialState);
}

export function useGroupsContext() {
  const contextInfo = useContext(GroupsContext);
  if (!contextInfo) throw new Error("No Groups Context available, make sure a parent GroupsProvider component is available");
  return contextInfo;
}

export type SetState<S> = (state: S | ((state: S) => S)) => void;

// Actions

export function addGroup(state: IGroupState, group: Readonly<IGroup>) {
  return {
    ...state,
    selectedIndex: state.groups.length,
    groups: [...state.groups, group],
  };
}

export function canDeleteGroup(state: IGroupState, deleteIndex?: number) {
  if (deleteIndex === undefined) deleteIndex = state.selectedIndex;
  if (deleteIndex < 0) return false;
  if (deleteIndex >= state.groups.length) return false;
  return true;
}

export function deleteGroup(state: IGroupState, deleteIndex?: number) {
  if (deleteIndex === undefined) deleteIndex = state.selectedIndex;
  if (!canDeleteGroup(state, deleteIndex)) return state;
  return {
    ...state,
    selectedIndex: state.selectedIndex === deleteIndex ? -1 : state.selectedIndex,
    groups: state.groups.filter((_, i) => deleteIndex !== i),
  };
}

export function canReplaceGroup(state: IGroupState, replaceIndex?: number) {
  if (replaceIndex === undefined) replaceIndex = state.selectedIndex;
  if (replaceIndex < 0) return false;
  if (replaceIndex >= state.groups.length) return false;
  return true;
}

export function replaceGroup(state: IGroupState, group: IGroup, replaceIndex?: number) {
  if (replaceIndex === undefined) replaceIndex = state.selectedIndex;
  if (!canReplaceGroup(state, replaceIndex)) return state;
  const newGroups = [...state.groups]; // clone
  newGroups[replaceIndex] = group;
  return {
    ...state,
    groups: newGroups,
  };
}

export function canMoveGroup(state: IGroupState, to: number, from?: number) {
  if (from === undefined) from = state.selectedIndex;
  if (from < 0) return false;
  if (from === to) return false;
  if (from < 0 && from >= state.groups.length) return false;
  if (to < 0 && to >= state.groups.length) return false;
  return true;
}

export function moveGroup(state: IGroupState, toIndex: number, fromIndex?: number) {
  if (fromIndex === undefined) fromIndex = state.selectedIndex;
  if (!canMoveGroup(state, toIndex, fromIndex)) return state;

  const newGroups = [...state.groups];
  const [group] = newGroups.splice(fromIndex, 1);
  newGroups.splice(toIndex, 0, group);

  return {
    ...state,
    groups: newGroups,
    selectedIndex: fromIndex === state.selectedIndex ? toIndex : state.selectedIndex,
  };
}

export function replaceGroups(state: IGroupState, groups: ReadonlyArray<IGroup>, selectIndex = -1) {
  return {
    ...state,
    groups,
    selectedIndex: selectIndex,
  };
}

export function canSelectGroup(state: IGroupState, selectIndex?: number) {
  if (selectIndex === undefined) selectIndex = state.selectedIndex;
  if (selectIndex < -1) return false;
  if (selectIndex >= state.groups.length) return false;
  if (selectIndex === state.selectedIndex) return false;
  return true;
}

export function selectGroup(state: IGroupState, selectIndex?: number) {
  if (selectIndex === undefined) selectIndex = state.selectedIndex;
  if (!canSelectGroup(state, selectIndex)) return state;
  return {
    ...state,
    selectedIndex: selectIndex,
  };
}

export function canSetHoverGroup(state: IGroupState, selectIndex?: number) {
  if (selectIndex === undefined) selectIndex = state.selectedIndex;
  if (selectIndex < -1) return false;
  if (selectIndex >= state.groups.length) return false;
  if (selectIndex === state.hoveredIndex) return false;
  return true;
}

export function setHoverGroup(state: IGroupState, hoverIndex?: number) {
  if (hoverIndex === undefined) hoverIndex = state.selectedIndex;
  if (!canSetHoverGroup(state, hoverIndex)) return state;
  return {
    ...state,
    hoveredIndex: hoverIndex,
  };
}

export function getSelectedGroup(state: IGroupState): Readonly<IGroup> | undefined {
  return state.groups[state.selectedIndex];
}

export function getHoveredGroup(state: IGroupState): Readonly<IGroup> | undefined {
  return state.groups[state.hoveredIndex];
}

// Reducer
function groupsReducer(state: IGroupState, action: IGroupAction) {
  switch (action.type) {
    case "ADD_GROUP": return addGroup(state, action.group);
    case "DELETE_GROUP": return deleteGroup(state, action.deleteIndex);
    case "REPLACE_GROUP": return replaceGroup(state, action.group, action.replaceIndex);
    case "MOVE_GROUP": return moveGroup(state, action.toIndex, action.fromIndex);
    case "REPLACE_GROUPS": return replaceGroups(state, action.groups, action.selectIndex);
    case "SELECT_GROUP": return selectGroup(state, action.selectIndex);
    case "HOVER_GROUP": return setHoverGroup(state, action.hoverIndex);
    default:
      // exhaustiveFail(action.type);
      return state;
  }
}
