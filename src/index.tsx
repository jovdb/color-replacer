import { render } from "react-dom";
import React from "react";
import { GroupsContext, useGroupsState } from "./state/groups";
import { RenderContext, useRenderState } from "./state/render";
import { ImageContext, useImageState } from "./state/image";
import App from "./App";
import "./style.css";
import { withDebug } from "./hooks/hooks";
import { pipe } from "./pipe";

function Bootstrap() {

  const groupContext = useGroupsState();
  const renderContext = useRenderState();
  const imageContext = useImageState();

  return <GroupsContext.Provider value={groupContext}>
    <RenderContext.Provider value={renderContext}>
      <ImageContext.Provider value={imageContext}>
        <App/>
      </ImageContext.Provider>
    </RenderContext.Provider>
  </GroupsContext.Provider>;
}

const Root = pipe(
  Bootstrap,
  withDebug(),
);

render(<Root/>, document.getElementById("root"));
