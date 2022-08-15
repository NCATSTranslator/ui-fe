import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import Query3 from "../../Components/Query/Query3";
import translatorInfographic from "../../Assets/Images/translator-infographic.jpg";
import berkeley from "../../Assets/Images/Logos/berkeley.png";
import bma from "../../Assets/Images/Logos/bma.png";
import broad from "../../Assets/Images/Logos/broad.png";
import columbia from "../../Assets/Images/Logos/columbia.png";
import covar from "../../Assets/Images/Logos/covar.png";
import dartmouth from "../../Assets/Images/Logos/dartmouth.png";
import drexel from "../../Assets/Images/Logos/drexel.png";
import harvard from "../../Assets/Images/Logos/harvard.png";
import isb from "../../Assets/Images/Logos/isb.png";
import maas from "../../Assets/Images/Logos/maas.png";
import nih from "../../Assets/Images/Logos/nih.png";
import osu from "../../Assets/Images/Logos/osu.png";
import penn from "../../Assets/Images/Logos/penn.png";
import renci from "../../Assets/Images/Logos/renci.png";
import scripps from "../../Assets/Images/Logos/scripps.png";
import tufts from "../../Assets/Images/Logos/tufts.png";
import uab from "../../Assets/Images/Logos/uab.png";
import ucamc from "../../Assets/Images/Logos/ucamc.png";
import ucd from "../../Assets/Images/Logos/ucd.png";
import ucsf from "../../Assets/Images/Logos/ucsf.png";
import styles from "./Home.module.scss";

const Home = () => {

  return (
    <div>
      <Query3 />
      <div className={styles.homePageContent}>
        <div className={styles.section}>
          <div className={`${styles.container} container`}>
            <h5 className={styles.heading}>How it Works</h5>
            <img src={translatorInfographic} alt="" />
            <div className={styles.threeCol}>
              <div className={styles.colOne}>
                <p>A researcher will be able to use NCATS Biomedical Data Translator to help answer difficult biomedical questions like, "predict treatments for disease Y." </p>
              </div>
              <div className={styles.colTwo}>
                <p>The query will be sent to Translator's Autonomous Relay Agents (ARAs) to determine how best to answer the query. The ARA will break the query into smaller tasks that are transmitted to rich, specialty knowledge bases called Knowledge Providers (KPs).</p>
              </div>
              <div className={styles.colThree}>
                <p>This process will be iterative, such that the ARAs and KPs can build on information from the others. Researchers will be able to explore this distilled knowledge and help them to develop new research hypotheses that lead to new scientific discoveries!</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <div className={`${styles.container} container`}>
            <div className={styles.twoCol}>
              <div className={styles.colOne}>
                <h5>Goals of Translator</h5>
                <p>There is a wealth of knowledge available to translational scientists and biomedical researchers. This diverse information, which includes patient health records, clinical trials, and medical literature, can be found in a wide variety of databases. However, each of these sources use their own unique nomenclature, making it extremely difficult to find and understand potential treatments for rare diseases and genetic disorders. To address this issue, the National Center for Advancing Translational Sciences (NCATS) launched the Biomedical Data Translator program in 2016 with the hopes of developing a powerful search tool for biomedical data. The goal of Translator is to:</p>
                <ul>
                  <li>Help researchers understand the pathophysiology of human disease.</li>
                  <li>Connect clinical observations with molecular etiology.</li>
                  <li>Identify shared molecular etiologies underlying multiple diseases.</li>
                  <li>Redefine diseases through new clinical endotypes and clinical regroupings.</li>
                  <li>Identify new opportunities for drug repurposing.</li>
                  <li>Facilitate the generation of new hypotheses for understanding and treating disease.</li>
                </ul>
              </div>
              <div className={styles.colTwo}>
                <h5>Articles and News</h5>
                <p>Learn how the Biomedical Data Translator program aims to help researchers more easily access and interrelate different data and languages.</p>
                <ul>
                  <li>Use Case Show Translator's Potential to Expedite Clinical Research</li>
                  <li>Biomedical Data Platform Moves to the Next Phase</li>
                  <li>Defining Clinical Outcome Pathways</li>
                  <li>NIH-Funded Project Aims to Build a 'Google' for Biomedical Data</li>
                  <li>Deconstructing the Translational Tower of Babel</li>
                  <li>Toward A Universal Biomedical Data Translator</li>
                  <li>The Biomedical Data Translator Program: Conception, Culture, and Community</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.section} ${styles.collaborators}`}>
          <div className="container">
            <h5>Collaborators</h5>
            <p>Translator is made possible through collaboration with scientific experts and developers from the following institutions:</p>
            <div className={styles.logos}>
              <img src={ucd} alt="" />
              <img src={penn} alt="" />
              <img src={columbia} alt="" />
              <img src={osu} alt="" />
              <img src={maas} alt="" />
              <img src={uab} alt="" />
              <img src={bma} alt="" />
              <img src={tufts} alt="" />
              <img src={renci} alt="" />
              <img src={harvard} alt="" />
              <img src={scripps} alt="" />
              <img src={drexel} alt="" />
              <img src={berkeley} alt="" />
              <img src={dartmouth} alt="" />
              <img src={broad} alt="" />
              <img src={isb} alt="" />
              <img src={covar} alt="" />
              <img src={ucamc} alt="" />
              <img src={nih} alt="" />
              <img src={ucsf} alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;