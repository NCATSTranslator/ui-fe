import React, { useState } from "react";
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
    <div className="carousel-container">
      <div className="controls">
        <button onClick={prevSlide} className={`${(currentSlide + numSlides === numSlides)} prev`}><Left /></button>
        <div className="carousel">
          <ul className="control-dots">
            {
              dots.map((item, index) => {
                let dotClass = (index === currentSlide) ? 'dot selected' : 'dot';
                return(
                  <li
                    // style={indicatorStyles}
                    onClick={()=>{updateCurrentSlide(index)}}
                    // onKeyDown={onClickHandler}
                    className={dotClass}
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
        <button onClick={nextSlide} className={`${(numSlides - currentSlide === 1)} next`}><Right /></button>
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