import React, { useState } from "react";
import styles from 'CustomCarousel.module.scss';
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import { Carousel } from 'react-responsive-carousel';
import {ReactComponent as Left} from '../../Icons/Directional/Left.svg';
import {ReactComponent as Right} from '../../Icons/Directional/Right.svg';


const CustomCarousel = ({numberOfSlides, children}) => {

  const [currentSlide, setCurrentSlide] = useState(0);
  const numSlides = numberOfSlides;
  var dots = [];
  for (let i = 0; i < numSlides; i++) {
    dots.push(<li>dot</li>);
  }

  const nextSlide = () => {
    setCurrentSlide(currentSlide + 1);
  }

  const prevSlide = () => {
    setCurrentSlide(currentSlide - 1);
  }

  const updateCurrentSlide = (index) => {
    if (currentSlide !== index) {
      setCurrentSlide(index);
    }
  }

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.controls}>
        <button onClick={prevSlide} className={`${(currentSlide + numSlides === numSlides)} ${styles.prev}`}><Left /></button>
        <div className={styles.carousel}>
          <ul className={styles.controlDots}>
            {
              dots.map((item, index) => {
                let dotClass = (index === currentSlide) ? styles.selected : '';
                return(
                  <li
                    onClick={()=>{updateCurrentSlide(index)}}
                    // onKeyDown={onClickHandler}
                    className={`${styles.dot} ${dotClass}`}
                    value={index}
                    key={index}
                    role="button"
                    tabIndex={0}
                    title={`${index + 1}`}
                    aria-label={`${index + 1}`}
                  >
                  </li>
                )
              })
            }
          </ul>
        </div>
        <button 
          onClick={nextSlide} 
          className={`${(numSlides - currentSlide === 1) ? styles.true: ''} ${styles.next}`}
          >
          <Right />
        </button>
      </div>
      <Carousel
        selectedItem={currentSlide}
        onChange={updateCurrentSlide}
        showThumbs={false}
        showIndicators={false}
        showStatus={false}
        showArrows={false}
      >
        {children}
      </Carousel>
    </div>
  );
}

export default CustomCarousel;