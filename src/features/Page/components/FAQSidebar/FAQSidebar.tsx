import { FC, useEffect, useState } from "react";
import styles from './FAQSidebar.module.scss';
import { NavLink, useLocation } from 'react-router-dom';
import Accordion from '@/features/Common/components/Accordion/Accordion';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { FAQArticle } from "@/features/Page/types/page";

interface FAQSidebarProps {
  articles: FAQArticle[];
}

const FAQSidebar: FC<FAQSidebarProps> = ({ articles }) => {

  const location = useLocation();
  const [activeSlug, setActiveSlug] = useState<string>(location.pathname.replace('/', ''));

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
              articles.map((article, i) => {
                const isExtLink = !!article.link;
                const link = article.link ? article.link : `/${article.slug}`;
                return (
                  <li key={i} className={(article.slug === activeSlug ? styles.active : '')}>
                    {
                      !article.subArticles && !isExtLink &&
                      <NavLink 
                        to={link} 
                        className={styles.navLink}
                        >
                        {article.title}
                      </NavLink>
                    }
                    {
                      !article.subArticles && isExtLink &&
                      <a 
                        href={link} 
                        className={styles.navLink}
                        target="_blank"
                        rel="noreferrer"
                        >
                        {article.title}
                        <ExternalLink />
                      </a>
                    }
                    {
                      article.subArticles && 
                      <Accordion 
                        title={article.title} 
                        titleLink={link}
                        navLink={!isExtLink}
                        extLink={isExtLink}
                        accordionClass={styles.accordion}
                        panelClass={styles.accordionPanel}
                        expanded={!!article.subArticles?.find(subArticle => subArticle.slug === activeSlug)}
                        >
                        <ul className={`${styles.links} ${styles.subLinks}`}>
                          {
                            article.subArticles.map((subArticle, j) => {
                              const key = `${i}_${j}`;
                              const isExtLinkSub = !!subArticle.link;
                              const linkSub = subArticle.link ? subArticle.link : `/${subArticle.slug}`;
                              return (             
                                <li key={key} className={(subArticle.slug === activeSlug ? styles.active : '')}>
                                  {isExtLinkSub && 
                                    <a 
                                      href={linkSub} 
                                      className={styles.navLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      >
                                      {subArticle.title}
                                      <ExternalLink />
                                    </a>
                                  }
                                  {
                                    !isExtLinkSub &&
                                    <NavLink 
                                      to={linkSub} 
                                      className={styles.navLink}
                                      >
                                      {subArticle.title}
                                    </NavLink>
                                  }
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