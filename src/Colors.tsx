import { Button, ButtonBase } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import ArrowForward from "@material-ui/icons/ArrowForward";
import ArrowBack from "@material-ui/icons/ArrowBack";
import React from "react";
import "./colors.css";
import { withDebug, useCallback } from "./hooks/hooks";
import { showColorPickerAsync } from "./showColorPicker";
import { useGroupsContext, getSelectedGroup, canSetHoverGroup } from "./state/groups";
import * as colorspaces from "./colorspaces";
import { pipe } from "./pipe";

function Colors({
  onSourceClick,
  onTargetClick,
}: {
  onSourceClick?(i: number): void;
  onTargetClick?(i: number): void;
}) {

  const [groupsState, dispatchToGroups] = useGroupsContext();

  const onSourceClicked = useCallback(async function onSourceClicked(e: React.FormEvent<HTMLElement>) {
    e.stopPropagation();
    const el = (e.target as any).closest(".color-group");
    const index = +el.getAttribute("data-index")!;

    if (index === groupsState.selectedIndex) {
      const group = getSelectedGroup(groupsState);
      if (group) {
        const sourceColor = await showColorPickerAsync(group.sourceColor || "#ffffff");
        const newGroup = {...group, sourceColor};
        dispatchToGroups({
          type: "REPLACE_GROUP",
          group: newGroup,
        });
        if (onSourceClick) onSourceClick(index);
      }
    } else {
      dispatchToGroups({
        type: "SELECT_GROUP",
        selectIndex: index,
      });
      if (onSourceClick) onSourceClick(index);
    }
  }, [groupsState, onSourceClick, dispatchToGroups]);

  const onTargetClicked = useCallback(async function onTargetClicked(e: React.FormEvent<HTMLElement>) {
    e.stopPropagation();
    const el = (e.target as any).closest(".color-group");
    const index = +el.getAttribute("data-index")!;
    if (index === groupsState.selectedIndex) {
      const group = getSelectedGroup(groupsState);
      if (group) {
        const targetColor = await showColorPickerAsync(group.targetColor || "#ffffff");
        const newGroup = {...group, targetColor};
        dispatchToGroups({
          type: "REPLACE_GROUP",
          group: newGroup,
        });
        if (onTargetClick) onTargetClick(index);
      }
    } else {
      dispatchToGroups({
        type: "SELECT_GROUP",
        selectIndex: index,
      });
      if (onSourceClick) onSourceClick(index);
    }
  }, [groupsState, onSourceClick, onTargetClick, dispatchToGroups]);

  const onSelectGroup = useCallback(function onSelectGroup(e: React.FormEvent<HTMLElement>) {
    const el = (e.target as any).closest(".color-group");
    const index = +el.getAttribute("data-index")!;
    dispatchToGroups({
      type: "SELECT_GROUP",
      selectIndex: index,
    });
  }, [dispatchToGroups]);

  const onMouseMove = useCallback(function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = (e.target as any).closest(".color-group");
    const index = el ? +(el.getAttribute("data-index")!) : -1;
    if (index !== -1 && canSetHoverGroup(groupsState, index)) {
      dispatchToGroups({
        type: "HOVER_GROUP",
        hoverIndex: index,
      });
    }
  }, [groupsState, dispatchToGroups]);

  const onMouseLeave = useCallback(function onMouseLeave() {
    const index = -1;
    if (canSetHoverGroup(groupsState, index)) {
      dispatchToGroups({
        type: "HOVER_GROUP",
        hoverIndex: index,
      });
    }
  }, [groupsState, dispatchToGroups]);

  const onGroupAdd = useCallback(function onGroupAdd() {
    dispatchToGroups({
      type: "ADD_GROUP",
      group: {
        hue: 180,
        hueMax: 185,
        hueMin: 175,
        lumMax: 0.95,
        lumMethod: "clip",
        lumMin: 0.05,
        satMax: 0.95,
        satMethod: "clip",
        satMin: 0.05,
      },
    });
  }, [dispatchToGroups]);

  const onDeleteClicked = useCallback(function onDeleteClicked() {
    dispatchToGroups({
      type: "DELETE_GROUP",
    });
  }, [dispatchToGroups]);

  const onMoveRight = useCallback(function onMoveClicked() {
    dispatchToGroups({
      type: "MOVE_GROUP",
      toIndex: groupsState.selectedIndex + 1,
    });
  }, [dispatchToGroups, groupsState.selectedIndex]);

  const onMoveLeft = useCallback(function onMoveClicked() {
    dispatchToGroups({
      type: "MOVE_GROUP",
      toIndex: groupsState.selectedIndex - 1,
    });
  }, [dispatchToGroups, groupsState.selectedIndex]);

  const colors = groupsState.groups
    ? groupsState.groups.map((group) => ({
      from: group.sourceColor || colorspaces.hslToRgb(group.hue / 360.0, 1, (group.lumMax + group.lumMin) / 2).toHex(),
      to: group.targetColor,
    }))
    : [];

  return <div
    className="colors"
    onMouseMove={onMouseMove}
    onMouseLeave={onMouseLeave}
  >
    {colors.map(({from, to}, i) => (
      <span
        key={`group-${i}`}
        className={`color-group${groupsState.selectedIndex === i ? " selected" : ""}`}
        data-index={i}
        onClick={onSelectGroup}
        >
        <ButtonBase
          className="color"
          focusRipple
          style={{backgroundColor: from}}
          onClick={onSourceClicked}
        ></ButtonBase><span style={{fontSize: "1.5em", verticalAlign: "middle"}}>⯈</span><ButtonBase
          className={`color${ to ? "" : " empty"}`}
          focusRipple
          style={to ? { backgroundColor: to } : undefined}
          onClick={onTargetClicked}
        ></ButtonBase>
      </span>
    ))}

    <Button onClick={onGroupAdd}>
      <AddIcon/>
    </Button>

    { groupsState.selectedIndex >= 0
        ? <Button
        size="small"
        onClick={onDeleteClicked}
        hidden={groupsState.selectedIndex < 0}>
        <DeleteIcon />
      </Button>
      : undefined
    }

    { groupsState.groups.length >= 2
      ? <Button
        onClick={onMoveLeft}
        hidden={groupsState.groups.length < 2}
        disabled={groupsState.selectedIndex < 1}>
        <ArrowBack/>
      </Button>
      : undefined
    }

    { groupsState.groups.length >= 2
      ? <Button
        onClick={onMoveRight}
        hidden={groupsState.groups.length < 2}
        disabled={groupsState.selectedIndex + 1 >= groupsState.groups.length}>
        <ArrowForward/>
      </Button>
      : undefined
    }

  </div>;
}

export default pipe(
  Colors,
  withDebug(),
);
