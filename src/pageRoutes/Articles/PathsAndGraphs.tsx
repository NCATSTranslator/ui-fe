import HelpEdgeDiagram from "@/assets/images/HelpEdgeDiagram.png";
import { Link } from 'react-router-dom';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';

export const PathsAndGraphs = () => {
  const { togglePanel } = useSidebar();
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <p>
        Translator uses systems biology and complex knowledge graphs to uncover{" "}
        <strong>inferred or literature-supported relationships between biomedical entities</strong>. These results are
        displayed as both paths and graphs.
      </p>

      <h2 className="h6">Paths</h2>

      <p>
        Paths are <strong>linear relationships between biomedical entities</strong> that display complex graph networks
        step by step. In Smart Queries, every path begins with a result and ends with your selected search term. In
        Pathfinder Queries, every path begins with your first search term and ends with your second.
      </p>

      <p>Each path is made up of <strong>objects</strong> and <strong>relationships</strong> between them.</p>

      <ul>
        <li>
          <strong>Objects</strong> (ex. “NGLY1,” “Wilson Disease,” “Propranalol”) are biomedical entities. Search terms
          you enter are also considered to be objects in paths.
        </li>
        <li>
          <strong>Relationships</strong> (ex. “impacts,” “associated with,” “subclass of”) describe how the objects are
          connected. You can click on any relationship to view the{" "}
          <a href="/relationship-evidence">evidence</a> behind it.
        </li>
      </ul>

      <p>There are two different types of paths you will encounter in your results.</p>

      <ul>
        <li>
          <strong>Direct Paths</strong> connect two biomedical entities without any intermediary objects.
        </li>
        <li>
          <strong>Indirect Paths</strong> reveal inferred relationships between entities by identifying intermediary
          concepts that link them together.
        </li>
      </ul>

      <p>
        When two pieces of information aren&apos;t directly connected in our knowledge graph, Translator’s{" "}
        <Link to="/about-translator#reasoning-agents">reasoning agents</Link> look at{" "}
        <strong>existing relationships and apply logical rules</strong> to suggest possible connections in the form of{" "}
        <strong>indirect paths</strong>. For example, if <em>Gene A</em> affects <em>Protein B</em> and{" "}
        <em>Protein B</em> is linked to <em>Disease C</em>, a connection between <em>Gene A</em> and <em>Disease C</em>{" "}
        may be inferred.
      </p>

      <p style={{textAlign: 'center', margin: '30px auto'}}><img src={HelpEdgeDiagram} style={{display: 'block'}} alt="Gene A to Protein B to Disease C indicates an indirect relationship between Gene A and Disease C" /></p>

      <h2 className="h6">Graphs</h2>

      <p>
        Graphs present the same information shown in paths, but display the{" "}
        <strong>full network of relationships all at once</strong>. This non-linear representation complements paths by
        revealing broader patterns, clusters, and relationships that may be harder to see when examining paths alone.
      </p>

      <p>
        A result’s graph can be viewed in a vertical, horizontal, or concentric layout. To{" "}
        <strong>change the default layout</strong> for all results, adjust your preferences in the sidebar{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); togglePanel('settings'); }}>Account Settings</a> tab.
      </p>

      <p>
        You can also <strong>move objects in each graph around</strong> to get a better look at their relationships or
        to make your own custom graph view. To reset the graph back to its original layout, click the{" "}
        <strong>Reset View</strong> button.{" "}
        <em>Please note that clicking on a different graph layout will also reset the view.</em>
      </p>
    </>
  );
};

