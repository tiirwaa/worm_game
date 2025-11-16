# 🐍 Gusano 3D

Un emocionante juego de *snake* en 3D desarrollado con Three.js, donde controlas un gusano futurista que se mueve por un plano tridimensional. Come la comida para crecer, evita chocarte contra ti mismo o los límites marcados por rayos láser rojos, y disfruta de efectos visuales y sonoros inmersivos en esta experiencia 3D.

![Imagen del juego Gusano 3D](./logoworm3d.png)
![Worm 3D Game Image](./gusano3d.png)

## 🎮 Cómo jugar

- Presiona **espacio** o **toca la pantalla** para iniciar el juego.
- Usa las teclas de dirección (**flechas** o **WASD**) para mover el gusano.
- En dispositivos táctiles, usa los botones en pantalla para controlar la dirección.
- Come la comida roja para crecer, sumar puntos y activar efectos especiales.
- Evita chocarte contra ti mismo o los bordes marcados por rayos láser, o todas las bolas explotarán en una lluvia de partículas.

## 🚀 Características

- **Gráficos 3D Avanzados**: Movimiento y renderizado en 3D con Three.js, incluyendo sombras y iluminación dinámica.
- **Fondo Animado**: Textura procedural de piso neon que se desplaza con el movimiento del gusano.
- **Efectos Visuales**:
  - Gusano con cabeza brillante y cuerpo alternando colores (azul y naranja).
  - Ojos animados que siguen la dirección de movimiento.
  - Partículas al comer comida.
  - Rayos láser rojos y azules que salen de la comida al ser consumida.
  - Rayos de borde rojos destellantes que indican los límites del área jugable.
  - Explosión de todas las bolas del gusano en partículas rojas al chocar con bordes o consigo mismo.
- **Audio Procedural**: Música de fondo arcade generada proceduralmente y efectos de sonido para movimientos, comer y game over, usando WebAudio API.
- **Controles de Audio**: Sliders separados para ajustar volumen de música y efectos, con toggle para música. Configuraciones guardadas en navegador.
- **Controles Adaptativos**: Soporte completo para teclado y dispositivos táctiles, con botones en pantalla para móviles.
- **UI Interactiva**: Overlays de inicio y game over con logo, controles de audio y reinicio fácil.
- **Responsive**: Diseño adaptativo con overlay de rotación para dispositivos móviles en orientación portrait.
- **Puntaje en Tiempo Real**: Muestra el puntaje actualizado.
- **Persistencia**: Configuraciones de audio guardadas localmente.

## 🛠️ Tecnologías Usadas

- **Three.js**: Para gráficos y renderizado 3D.
- **WebAudio API**: Para síntesis de audio procedural.
- **HTML5 Canvas**: Para generar texturas dinámicas.
- **JavaScript ES6+**: Lógica del juego y animaciones.
- **CSS**: Estilos y overlays responsivos.
- **LocalStorage**: Persistencia de configuraciones.

## 🎮 Jugar Ahora
https://agsoft.co.cr/juegos/gusano3d/gusano.html

[![Logo de A&G](https://agsoft.co.cr/wp-content/uploads/2023/08/logo.png)](https://agsoft.co.cr)  
Autor: Andrey Rodríguez Araya
_Creado por **A&G Programación y Desarrollo de Sistemas Informáticos S.A.**_
