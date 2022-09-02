import React, { useEffect, useState } from "react";
import styles from './FAQSidebar.module.scss';
import { NavLink } from 'react-router-dom';
import Accordion from '../Accordion/Accordion';
import { useLocation } from "react-router-dom";

const FAQSidebar = ({articles}) => {


  const location = useLocation();
  console.log(location.pathname);
  const [activeSlug, setActiveSlug] = useState(location.pathname.replace('/', ''));

  useEffect(() => {
    setActiveSlug(location.pathname.replace('/', ''));
  }, [location]);

  return(
    <div className={styles.faqSidebar}>
      <div className={styles.faqSidebarContainer}>
        <h5>Help Topics</h5>
        <nav>
          <ul className={styles.links}>
            {
              articles.map((article, i)=> {
                console.log(article)
                return (
                  <li key={i} className={(article.slug === activeSlug ? styles.active : '')}>
                    {
                      !article.subArticles && 
                      <NavLink 
                        to={`/${article.slug}`} 
                        className={styles.navLink}
                        >
                        {article.title}
                      </NavLink>
                    }
                    {
                      article.subArticles && 
                      <Accordion 
                        title={article.title} 
                        titleLink={`/${article.slug}`}
                        navLink
                        accordionClass={styles.accordion}
                        panelClass={styles.accordionPanel}
                        >
                        <ul className={`${styles.links} ${styles.subLinks}`}>
                          {
                            article.subArticles.map((subArticle, j) => {
                              let key = `${i}_${j}`;
                              return (             
                                <li key={key} className={(subArticle.slug === activeSlug ? styles.active : '')}>
                                  <NavLink 
                                    to={`/${subArticle.slug}`} 
                                    className={styles.navLink}
                                    >
                                    {subArticle.title}
                                  </NavLink>
                                </li>       
                              )                   
                            })
                          }
                        </ul>
                      </Accordion>
                    }
                  </li>
                )
              })
            }
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default FAQSidebar;