import multer from "multer";

const storage = multer.memoryStorage(); // Almacena la imagen en memoria
const upload = multer({ storage });

export default upload;
