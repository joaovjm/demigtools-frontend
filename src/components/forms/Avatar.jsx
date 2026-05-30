function Avatar({ name, size = 50 }) {
    // Pega as iniciais do nome
    const initials = name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2); // Máximo 2 letras
  
    // Gera uma cor aleatória baseada no nome
    const stringToColor = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = `hsl(${hash % 360}, 70%, 50%)`;
      return color;
    };
  
    const bgColor = stringToColor(name);
  
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: size / 2,
          userSelect: "none"
        }}
      >
        {initials}
      </div>
    );
  }
  
  export default Avatar;
  