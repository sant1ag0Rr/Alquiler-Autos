import { useEffect, useRef, useState, useCallback } from "react";
import ReactDom from "react-dom";
import { IoCloseCircleOutline } from "react-icons/io5";
import PropTypes from 'prop-types';

const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  
  return ReactDom.createPortal(children, document.body);
};

const Modal = ({
  children,
  isOpen,
  onClose,
  isDismissible = true,
  showCloseIcon = true,
  toAnimate = true,
  animationEnter = "zoomIn",
  animationExit = "zoomOut",
  className = "",
}) => {
  const modalRef = useRef(null);
  const [mouseDownEv, setMouseDownEv] = useState(null);

  const handleMouseDown = useCallback((e) => {
    setMouseDownEv({ screenX: e.screenX, screenY: e.screenY });
  }, []);

  const checkOutsideAndCloseModal = useCallback((e) => {
    if (!isDismissible || !mouseDownEv) return;
    
    if (
      !modalRef.current || 
      modalRef.current.contains(e.target) ||
      Math.abs(mouseDownEv.screenX - e.screenX) > 15 ||
      Math.abs(mouseDownEv.screenY - e.screenY) > 15
    ) {
      return;
    }
    
    onClose();
    setMouseDownEv(null);
  }, [isDismissible, mouseDownEv, onClose]);

  const getAnimationClass = useCallback((type, animation) => {
    const animations = {
      enter: {
        slideInFromDown: "animate-[slideInFromDown_500ms_forwards]",
        slideInFromUp: "animate-[slideInFromUp_500ms_forwards]",
        slideInFromLeft: "animate-[slideInFromLeft_500ms_forwards]",
        slideInFromRight: "animate-[slideInFromRight_500ms_forwards]",
        zoomIn: "animate-[zoomIn_500ms_forwards]",
      },
      exit: {
        slideOutToDown: "animate-[slideOutToDown_500ms_forwards]",
        slideOutToUp: "animate-[slideOutToUp_500ms_forwards]",
        slideOutToLeft: "animate-[slideOutToLeft_500ms_forwards]",
        slideOutToRight: "animate-[slideOutToRight_500ms_forwards]",
        zoomOut: "animate-[zoomOut_500ms_forwards]",
      }
    };

    return animations[type]?.[animation] || '';
  }, []);

  useEffect(() => {
    if (!isOpen || !isDismissible) return;

    const checkEscAndCloseModal = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", checkEscAndCloseModal);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", checkEscAndCloseModal);
    };
  }, [isOpen, isDismissible, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-0 flex items-center justify-center overflow-hidden bg-black bg-opacity-80 backdrop-blur-md duration-500 ${
          isOpen ? "opacity-100 z-[1000]" : "opacity-0 -z-50"
        }`}
        onClick={checkOutsideAndCloseModal}
        onMouseDown={handleMouseDown}
      >
        <div
          ref={modalRef}
          className={`
            relative max-h-screen max-w-[100vw] overflow-auto
            ${toAnimate ? "transition-all duration-500 ease-out" : ""}
            ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none select-none"}
            ${
              toAnimate && isOpen
                ? getAnimationClass('enter', animationEnter)
                : toAnimate
                ? getAnimationClass('exit', animationExit)
                : ''
            }
            ${className}
          `}
        >
          {showCloseIcon && (
            <div className="mr-4 mt-4 flex justify-end">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center focus:outline-none"
                onClick={onClose}
                aria-label="Close modal"
              >
                <IoCloseCircleOutline 
                  className="text-white hover:text-gray-300 transition-colors" 
                  style={{ width: 20, height: 20 }}
                  aria-hidden="true"
                />
              </button>
            </div>
          )}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </Portal>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isDismissible: PropTypes.bool,
  showCloseIcon: PropTypes.bool,
  toAnimate: PropTypes.bool,
  animationEnter: PropTypes.oneOf([
    'slideInFromDown',
    'slideInFromUp',
    'slideInFromLeft',
    'slideInFromRight',
    'zoomIn'
  ]),
  animationExit: PropTypes.oneOf([
    'slideOutToDown',
    'slideOutToUp',
    'slideOutToLeft',
    'slideOutToRight',
    'zoomOut'
  ]),
  className: PropTypes.string,
};

Modal.defaultProps = {
  isDismissible: true,
  showCloseIcon: true,
  toAnimate: true,
  animationEnter: 'zoomIn',
  animationExit: 'zoomOut',
  className: '',
};

export default Modal;