export const HowItWorks = () => {
  return (
    <>
      <p className="caption">Last updated on September 6th, 2022</p>
      <p>The Translator system has five main components.</p> 
      <p>The <strong>User Interface (UI)</strong> is intended to serve as the means of interaction between users and the Translator system.</p>
      <p>The <strong>Autonomous Relay System (ARS)</strong> functions as a central relay station, is managed by NCATS, and is intended to broadcast user queries to the broader Translator ecosystem.</p>
      <p><strong>Autonomous Relay Agents (ARAs)</strong> build upon the knowledge contributed by KPs by way of reasoning and inference across KPs.</p>
      <p><strong>Knowledge Providers (KPs)</strong> contribute domain-specific, high-value information abstracted from one or more underlying 'knowledge sources'.</p>
      <p>A <strong>Standards and Reference Implementation (SRI)</strong> component provides platform services and community-based collaboration guidance related to the development, adoption, and implementation of the standards needed to achieve the overall implementation goals of the Translator system.</p> 
      <p style={{textAlign: 'center'}}><img referrerPolicy="no-referrer" src="https://lh5.googleusercontent.com/iSfNjM2IonMBeXzyo4z6kxehnQ_MpZIJbOVQLmJ84KddHkGyoFGvmGp5s3axwOq0mpw=w2400" alt="Translator Architecture"/></p>
    </>
  );
}
