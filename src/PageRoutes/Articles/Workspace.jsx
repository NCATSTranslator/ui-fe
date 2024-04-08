import workspaceImage from "../../Assets/Images/workspace.png";

export const WorkspaceHelp = () => {

  return (
    <>
      <p className="caption">Last updated on September 8th, 2023</p>
      <p>The workspace retains all results that have been bookmarked. Other results are removed to allow focused review.</p>
      <p style={{'text-align': 'center'}}><img src={workspaceImage} alt="bookmarks displayed on the workspace page" /></p>
    </>
  );
}

      