import { useEffect, useRef } from "react";
import "./style.css";

function FormLog() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Cargar el contenido del HTML dentro del contenedor React
    fetch("/Form_log/index.html")
      .then((res) => res.text())
      .then((html) => {
        containerRef.current.innerHTML = html;

        // Insertar el script original
        const script = document.createElement("script");
        script.src = "/Form_log/script.js";
        script.type = "text/javascript";
        containerRef.current.appendChild(script);
      });
  }, []);

  return <div ref={containerRef} className="eco-form-wrapper"></div>;
}

export default FormLog;
