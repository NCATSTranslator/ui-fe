import { Link } from 'react-router-dom';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';

export const SortingAndFiltering = () => {
  const { togglePanel } = useSidebar();
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>
      <p>Due to the complexity of Translator's results, there are a <strong>range of sorting and filtering options</strong> that help you find novel relationships more quickly. You can sort by clicking on the <strong>result table headings</strong>, and can access filters by clicking on the <strong>sidebar Filters tab</strong>.</p>
      <p>Please let us know about any additional filters or sorting options you might need to support your research by <a href="#" onClick={(e) => { e.preventDefault(); togglePanel('feedback'); }}>sending us feedback</a>!</p>
      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg transform="rotate(180)" width="28" height="28" viewBox="0 -1 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 11L12 7M12 7L16 11M12 7V17" stroke="#606368" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        Sorting</h2>
      <p>You can sort results by clicking the column headers in the table. The currently available sorting options include:</p>
      <ul>
        <li>Name</li>
        <li>Evidence</li>
        <li>Paths</li>
        <li><Link to="/frequently-asked-questions#scores">Score</Link></li>
      </ul>
      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="28" height="28" viewBox="-3 -3 28 28" fill="#606368" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.2497 16.2417C15.802 16.2417 16.2497 16.6894 16.2497 17.2417V17.6584H19.083C19.4742 17.6584 19.7913 17.9755 19.7913 18.3667C19.7913 18.7579 19.4742 19.075 19.083 19.075H16.2497V19.4917C16.2497 20.044 15.802 20.4917 15.2497 20.4917H15.1247C14.5724 20.4917 14.1247 20.044 14.1247 19.4917V17.2417C14.1247 16.6894 14.5724 16.2417 15.1247 16.2417H15.2497ZM4.91634 17.6584C4.52514 17.6584 4.20801 17.9755 4.20801 18.3667C4.20801 18.7579 4.52514 19.075 4.91634 19.075H11.9997C12.3909 19.075 12.708 18.7579 12.708 18.3667C12.708 17.9755 12.3909 17.6584 11.9997 17.6584H4.91634ZM10.1663 9.8667C9.61406 9.8667 9.16634 10.3144 9.16634 10.8667V13.1167C9.16634 13.669 9.61406 14.1167 10.1663 14.1167H10.2913C10.8436 14.1167 11.2913 13.669 11.2913 13.1167V12.7H19.083C19.4742 12.7 19.7913 12.3829 19.7913 11.9917C19.7913 11.6005 19.4742 11.2834 19.083 11.2834L11.2913 11.2834V10.8667C11.2913 10.3144 10.8436 9.8667 10.2913 9.8667H10.1663ZM4.91634 11.2834C4.52514 11.2834 4.20801 11.6005 4.20801 11.9917C4.20801 12.3829 4.52514 12.7 4.91634 12.7H7.04134C7.43254 12.7 7.74967 12.3829 7.74967 11.9917C7.74967 11.6005 7.43254 11.2834 7.04134 11.2834H4.91634ZM15.1247 3.4917C14.5724 3.4917 14.1247 3.93941 14.1247 4.4917L14.1247 6.7417C14.1247 7.29398 14.5724 7.7417 15.1247 7.7417H15.2497C15.802 7.7417 16.2497 7.29398 16.2497 6.7417V6.32503L19.083 6.32503C19.4742 6.32503 19.7913 6.0079 19.7913 5.6167C19.7913 5.2255 19.4742 4.90837 19.083 4.90837L16.2497 4.90837V4.4917C16.2497 3.93941 15.802 3.4917 15.2497 3.4917H15.1247ZM4.91634 4.90837C4.52514 4.90837 4.20801 5.2255 4.20801 5.6167C4.20801 6.0079 4.52514 6.32503 4.91634 6.32503H11.9997C12.3909 6.32503 12.708 6.0079 12.708 5.6167C12.708 5.2255 12.3909 4.90837 11.9997 4.90837H4.91634Z" 
        stroke="#606368" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        Global Filters</h2>
      <p><strong>Bookmarks &amp; Notes</strong><br />
      Include or exclude results based on whether they have bookmarks or notes added to them.</p>
      <p><strong>Text Filter</strong><br />
      Include or exclude results or paths containing a word or phrase in the result name, description, or paths.</p>
      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="28" height="28" viewBox="-3 -3 28 28" fill="#606368" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.2497 16.2417C15.802 16.2417 16.2497 16.6894 16.2497 17.2417V17.6584H19.083C19.4742 17.6584 19.7913 17.9755 19.7913 18.3667C19.7913 18.7579 19.4742 19.075 19.083 19.075H16.2497V19.4917C16.2497 20.044 15.802 20.4917 15.2497 20.4917H15.1247C14.5724 20.4917 14.1247 20.044 14.1247 19.4917V17.2417C14.1247 16.6894 14.5724 16.2417 15.1247 16.2417H15.2497ZM4.91634 17.6584C4.52514 17.6584 4.20801 17.9755 4.20801 18.3667C4.20801 18.7579 4.52514 19.075 4.91634 19.075H11.9997C12.3909 19.075 12.708 18.7579 12.708 18.3667C12.708 17.9755 12.3909 17.6584 11.9997 17.6584H4.91634ZM10.1663 9.8667C9.61406 9.8667 9.16634 10.3144 9.16634 10.8667V13.1167C9.16634 13.669 9.61406 14.1167 10.1663 14.1167H10.2913C10.8436 14.1167 11.2913 13.669 11.2913 13.1167V12.7H19.083C19.4742 12.7 19.7913 12.3829 19.7913 11.9917C19.7913 11.6005 19.4742 11.2834 19.083 11.2834L11.2913 11.2834V10.8667C11.2913 10.3144 10.8436 9.8667 10.2913 9.8667H10.1663ZM4.91634 11.2834C4.52514 11.2834 4.20801 11.6005 4.20801 11.9917C4.20801 12.3829 4.52514 12.7 4.91634 12.7H7.04134C7.43254 12.7 7.74967 12.3829 7.74967 11.9917C7.74967 11.6005 7.43254 11.2834 7.04134 11.2834H4.91634ZM15.1247 3.4917C14.5724 3.4917 14.1247 3.93941 14.1247 4.4917L14.1247 6.7417C14.1247 7.29398 14.5724 7.7417 15.1247 7.7417H15.2497C15.802 7.7417 16.2497 7.29398 16.2497 6.7417V6.32503L19.083 6.32503C19.4742 6.32503 19.7913 6.0079 19.7913 5.6167C19.7913 5.2255 19.4742 4.90837 19.083 4.90837L16.2497 4.90837V4.4917C16.2497 3.93941 15.802 3.4917 15.2497 3.4917H15.1247ZM4.91634 4.90837C4.52514 4.90837 4.20801 5.2255 4.20801 5.6167C4.20801 6.0079 4.52514 6.32503 4.91634 6.32503H11.9997C12.3909 6.32503 12.708 6.0079 12.708 5.6167C12.708 5.2255 12.3909 4.90837 11.9997 4.90837H4.91634Z" 
        stroke="#606368" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        Result Filters</h2>
      <p>Some result filters only apply to specific query types.</p>
      <p><strong>Chemical Classification</strong><br />
      Include or exclude results based on their <a href="https://www.ebi.ac.uk/chebi/chebiOntology.do?chebiId=CHEBI:50906&treeView=true#vizualisation" target="_blank" rel="noreferrer">Chemical Entities of Biological Interest (ChEBI) role ontology</a>, a chemical classification that categorizes chemicals according to their biological role, chemical role, or application. This filter is only available in Smart Queries where the results are drugs or chemicals.</p>
      <p><strong>Development Stage</strong><br />
      Include or exclude results based on various development stages:</p>
      <ul>
        <li>Drugs include any chemical or biologic where Translator has identified an FDA approval status indicating it can be marketed for its indicated treatment. This does not mean that the drug has been tested for the disease that was searched.</li>
        <li>Phase 1-3 Drugs are chemical or biologics that are currently in clinical trials and have not been FDA approved previously.</li>
        <li>Other includes all other chemicals, as well as those available over the counter and not regulated by the FDA. This may include chemicals with little known about them or dietary supplements.</li>
      </ul>
      <p>This filter is only available in Smart Queries where the results are drugs or chemicals.</p>
      <p><strong>Availability</strong><br />
      Include or exclude results based on their availability to get as a prescription or over the counter. This filter is only available in Smart Queries where the results are drugs or chemicals.</p>
      <p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7818358/#:~:text=Target%20Development%20Level%20Ranking%20Details,targets%20with%20approved%20drugs%20available." target="_blank" rel="noreferrer"><strong>Target Development Level</strong></a><br />
      Include or exclude results based on how much is known about a potential drug target, particularly in terms of its validation and availability of chemical modulators. This filter is only available in Smart Queries where the results are genes or proteins.</p>
      <p><strong>Clinical Trial Indications</strong><br />
      Include or exclude results based on whether they have been tested in clinical trials for treatment of the indicated disease. This filter is only available in Smart Queries where the results are drugs.</p>
      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="28" height="28" viewBox="-3 -3 28 28" fill="#606368" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.2497 16.2417C15.802 16.2417 16.2497 16.6894 16.2497 17.2417V17.6584H19.083C19.4742 17.6584 19.7913 17.9755 19.7913 18.3667C19.7913 18.7579 19.4742 19.075 19.083 19.075H16.2497V19.4917C16.2497 20.044 15.802 20.4917 15.2497 20.4917H15.1247C14.5724 20.4917 14.1247 20.044 14.1247 19.4917V17.2417C14.1247 16.6894 14.5724 16.2417 15.1247 16.2417H15.2497ZM4.91634 17.6584C4.52514 17.6584 4.20801 17.9755 4.20801 18.3667C4.20801 18.7579 4.52514 19.075 4.91634 19.075H11.9997C12.3909 19.075 12.708 18.7579 12.708 18.3667C12.708 17.9755 12.3909 17.6584 11.9997 17.6584H4.91634ZM10.1663 9.8667C9.61406 9.8667 9.16634 10.3144 9.16634 10.8667V13.1167C9.16634 13.669 9.61406 14.1167 10.1663 14.1167H10.2913C10.8436 14.1167 11.2913 13.669 11.2913 13.1167V12.7H19.083C19.4742 12.7 19.7913 12.3829 19.7913 11.9917C19.7913 11.6005 19.4742 11.2834 19.083 11.2834L11.2913 11.2834V10.8667C11.2913 10.3144 10.8436 9.8667 10.2913 9.8667H10.1663ZM4.91634 11.2834C4.52514 11.2834 4.20801 11.6005 4.20801 11.9917C4.20801 12.3829 4.52514 12.7 4.91634 12.7H7.04134C7.43254 12.7 7.74967 12.3829 7.74967 11.9917C7.74967 11.6005 7.43254 11.2834 7.04134 11.2834H4.91634ZM15.1247 3.4917C14.5724 3.4917 14.1247 3.93941 14.1247 4.4917L14.1247 6.7417C14.1247 7.29398 14.5724 7.7417 15.1247 7.7417H15.2497C15.802 7.7417 16.2497 7.29398 16.2497 6.7417V6.32503L19.083 6.32503C19.4742 6.32503 19.7913 6.0079 19.7913 5.6167C19.7913 5.2255 19.4742 4.90837 19.083 4.90837L16.2497 4.90837V4.4917C16.2497 3.93941 15.802 3.4917 15.2497 3.4917H15.1247ZM4.91634 4.90837C4.52514 4.90837 4.20801 5.2255 4.20801 5.6167C4.20801 6.0079 4.52514 6.32503 4.91634 6.32503H11.9997C12.3909 6.32503 12.708 6.0079 12.708 5.6167C12.708 5.2255 12.3909 4.90837 11.9997 4.90837H4.91634Z" 
        stroke="#606368" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        Path Filters</h2>
      <p><strong>Objects within Paths</strong><br />
      Include or exclude paths from results that contain a particular type of object.</p>
      <p><strong>Evidence Type</strong><br />
      Include or exclude paths supported by various evidence types.</p>
      <p><strong>Path Type</strong><br />
      Include or exclude paths from results that contain direct or inferred relationships to the indicated disease.</p>
      <p><strong>Support Path Length</strong><br />
      Include or exclude paths from results that contain a set number of relationships.</p>
      <p><strong>Reasoning Agent</strong><br />
      Include or exclude <Link to="/about-translator#reasoning-agents">reasoning agents</Link> used to return results.</p>
    </>
  );
}
