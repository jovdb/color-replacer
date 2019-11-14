import { useContext, useState } from "../hooks/hooks";
import React from "react";
import { box, log } from "../logger";

/*
interface IGroupReducerActions {
  "ADD_GROUP": { type: "ADD_GROUP", group: Readonly<IGroup> };
  "DELETE_GROUP": { type: "DELETE_GROUP", deleteIndex?: number };
  "REPLACE_GROUP": { type: "REPLACE_GROUP", replaceIndex?: number, group: Readonly<IGroup> };
  "REPLACE_GROUPS": { type: "REPLACE_GROUPS", groups: ReadonlyArray<Readonly<IGroup>> };
  "SELECT_GROUP": { type: "SELECT_GROUP", selectIndex: number };
}

type IGroupAction = IGroupReducerActions[keyof IGroupReducerActions];
*/

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

function getBox() {
  return box("useGroupsState", "#22f", "#fff");
}

export function useGroupsState() {
  return useState<IGroupState>(initialState, "groupState");
}

export function useGroupsContext() {
  const contextInfo = useContext(GroupsContext);
  if (!contextInfo) throw new Error("No Groups Context available, make sure a parent GroupsProvider component is available");
  return contextInfo;
}

export type SetState<S> = (state: S | ((state: S) => S)) => void;

// Actions

export function addGroup(state: IGroupState, group: Readonly<IGroup>) {
  log(getBox(), `Adding group: ${JSON.stringify(group, undefined, "  ")}`);
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
  log(getBox(), `Deleting group: ${deleteIndex}: ${JSON.stringify(state.groups[deleteIndex], undefined, "  ")}`);
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

  log(getBox(), `Replacing group: ${replaceIndex}: from ${JSON.stringify(state.groups[replaceIndex], undefined, "  ")} to ${JSON.stringify(group, undefined, "  ")}`);
  const newGroups = [... state.groups]; // clone
  newGroups[replaceIndex] = group;
  return {
    ...state,
    groups: newGroups,
  };
}

export function replaceGroups(state: IGroupState, groups: ReadonlyArray<IGroup>) {
  log(getBox(), `Replacing groups: ${JSON.stringify(groups, undefined, "  ")}`);
  return {
    ...state,
    groups,
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

  log(getBox(), `Select group: ${selectIndex}`);
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

  log(getBox(), `Hovering group: ${hoverIndex}`);
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
