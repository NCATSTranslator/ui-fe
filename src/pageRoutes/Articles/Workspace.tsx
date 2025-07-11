import workspaceImage from "@/assets/images/workspace.png";

export const WorkspaceHelp = () => {

  return (
    <>
      <p className="caption">Last updated on September 25th, 2024</p>
      <p>The workspace retains all results that have been bookmarked. Other results are removed to allow focused review.</p>
      <p style={{textAlign: 'center'}}><img src={workspaceImage} alt="bookmarks displayed on the workspace page" /></p>
    </>
  );
}

      