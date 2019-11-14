import { render } from "react-dom";
import React from "react";
import { GroupsContext, useGroupsState } from "./state/groups";
import { RenderContext, useRenderState } from "./state/render";
import App from "./App";
import "./style.css";
import { withDebug } from "./hooks/hooks";
import { pipe } from "./pipe";

function Bootstrap() {

  const groupContext = useGroupsState();
  const renderContext = useRenderState();

  return <GroupsContext.Provider value={groupContext}>
    <RenderContext.Provider value={renderContext}>
      <App/>
    </RenderContext.Provider>;
  </GroupsContext.Provider>;
}

const Root = pipe(
  Bootstrap,
  withDebug(),
);

render(<Root/>, document.getElementById("root"));
