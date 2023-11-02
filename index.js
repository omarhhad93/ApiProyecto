const express = require("express");
const jwt = require("jsonwebtoken");
const { connect, getDB } = require("./cn");
const cors = require('cors');
const app = express();
app.use(cors());

connect();

app.use(express.json());
const collectionUsuarios = "Usuario"; // Collection los usuarios
const collectionProductos = "Producto"; // Collection de productos
const collectionbitacoras = "Bitacora"; // Collection de bitcatora

// Módulo de Registro de Usuarios
app.post("/api/registro/:dpi", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(collectionUsuarios);
    const datosFromBody = req.body;
    const dpiFromURL = req.params.dpi.toString();

    // Combina los datos del cuerpo con el valor de id de la URL en un nuevo objeto
    const datosAInsertar = {
      id: dpiFromURL,
      ...datosFromBody,
    };

    await collection.insertOne(datosAInsertar);

    res.status(201).json({
      message: "Registro realizado con éxito, los datos registrados son:",
      dpi: req.params.dpi.toString(),
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      fechanacimiento: req.body.fechanacimiento,
      direccion: req.body.direccion,
      nit: req.body.nit,
      numeroTelefono: req.body.numeroTelefono,
      CorreoElectronico: req.body.CorreoElectronico,
      clave: req.body.clave,
    });
  } catch (error) {
    console.error("Error al realizar el registro, por favor vuelve a intentar :c :", error);
    res.status(500).json({ error: "Error al realizar el registro, por favor vuelve a intentar :c" });
  }
});

// Módulo Login
app.post("/api/login", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(collectionUsuarios);
    const { CorreoElectronico, clave } = req.body;
    
    const usuarioEncontrado = await collection.findOne({
      CorreoElectronico,
      clave
    });

    if (!usuarioEncontrado) {
      res.status(401).json({ message: "Credenciales incorrectas, por favor verifique" });
      return;
    }

    const token = jwt.sign({ CorreoElectronico }, "secretKey", {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error al iniciar sesión, el error dado es:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

//Rutas Perfil
// Ruta para obtener información del perfil por DPI (GET)
app.get("/api/perfil/:DPI", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(collectionUsuarios);
    // const DPI = parseInt(req.params.DPI);
    const DPI = req.params.DPI
    
    const usuarioEncontrado = await collection.findOne({ id: DPI });

    if (!usuarioEncontrado) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    
    res.status(200).json(usuarioEncontrado);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

// Ruta para actualizar información del perfil (POST)
app.post("/api/perfil/:DPI", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(collectionUsuarios);
    const DPI = parseInt(req.params.DPI);
    const datosFromBody = req.body;

    // Verifica si algún campo está vacío
    for (const key in datosFromBody) {
      if (!datosFromBody[key]) {
        res.status(400).json({ message: "No se permiten campos vacíos" });
        return;
      }
    }
    // Actualiza los datos del usuario
    const filtro = { id: DPI };
    const actualizacion = {
      $set: {
        nombre: datosFromBody.nombre,
        apellido: datosFromBody.apellido,
        fechanacimiento: datosFromBody.fechanacimiento,
        direccion: datosFromBody.direccion,
        nit: datosFromBody.nit,
        numeroTelefono: datosFromBody.numeroTelefono,
        CorreoElectronico: datosFromBody.CorreoElectronico
      },
    };
    
    const resultado = await collection.updateOne(filtro, actualizacion);

    if (resultado.modifiedCount === 0) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.status(200).json({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar Usuario:", error);
    res.status(500).json({ error: "Error al actualizar Usuario" });
  }
});

// Ruta para eliminar un usuario e invalidar el Token (DELETE)
app.delete("/api/perfil/:DPI", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(collectionUsuarios);
    const DPI = parseInt(req.params.DPI);

    // Elimina el usuario por DPI
    const resultado = await collection.deleteOne({ id: DPI });

    if (resultado.deletedCount === 0) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.status(200).json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar Usuario:", error);
    res.status(500).json({ error: "Error al eliminar Usuario" });
  }
});

//Obtener Datos Productos
// Ruta para obtener productos (GET)
app.get("/api/productos", verifyToken, async (req, res) => {
  try {
    if (!req.user) {  
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }
    
    const db = getDB();
    const collection = db.collection(collectionProductos);

    const productos = await collection.find({}).toArray();

    res.status(200).json({ productos });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

//Gestion de Productos
// Ruta para obtener, crear, actualizar o eliminar productos (GET, POST, DELETE)
app.get("/api/Producto/:ID", verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    const db = getDB();
    const collection = db.collection(collectionProductos);
    const productoID = parseInt(req.params.ID);
    
    const producto = await collection.findOne({ identificador: productoID });

    if (!producto) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    res.status(200).json(producto);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

app.post("/api/Producto/:ID", verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    const db = getDB();
    const collection = db.collection(collectionProductos);
    const productoID = parseInt(req.params.ID);
    const datosFromBody = req.body;
    
    for (const key in datosFromBody) {
      if (!datosFromBody[key]) {
        res.status(400).json({ message: "No se permiten campos vacíos" });
        return;
      }
    }

    const filtro = { Identificador: productoID };
    const actualizacion = { $set: datosFromBody };
    const opciones = { upsert: true };

    await collection.updateOne(filtro, actualizacion, opciones);

    const productoActualizado = await collection.findOne({
      Identificador: productoID,
    });
    res.status(200).json(productoActualizado);
  } catch (error) {
    console.error("Error al crear o actualizar producto:", error);
    res.status(500).json({ error: "Error al crear o actualizar producto" });
  }
});

app.delete("/api/Producto/:id", verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    const db = getDB();
    const collection = db.collection(collectionProductos);
    const productoId = parseInt(req.params.id);
    
    const filtro = { Identificador: productoId };
    const actualizacion = { $set: { Habilitado: false } };
    const resultado = await collection.updateOne(filtro, actualizacion);

    if (resultado.modifiedCount === 0) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    res.status(200).json({ message: "Producto deshabilitado con éxito" });
  } catch (error) {
    console.error("Error al deshabilitar producto:", error);
    res.status(500).json({ error: "Error al deshabilitar producto" });
  }
});

//Carrito de compra
// Ruta para gestionar el carrito de compras (GET, POST, DELETE)
app.get("/api/carrito", verifyToken, async (req, res) => {
  try {    
    if (!req.user) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    const db = getDB();
    const collection = db.collection(collectionProductos);
    const usuario = req.user.CorreoElectronico;

    const carrito = await collection.findOne({ CorreoElectronico: usuario });

    if (!carrito || !carrito.Productos || carrito.Productos.length === 0) {
      res.status(404).json({ message: "Carrito de compras vacío, vamos a llenarlo :D" });
      return;
    }
    
    res.status(200).json(carrito);
  } catch (error) {
    console.error("Error al obtener carrito de compras:", error);
    res.status(500).json({ error: "Error al obtener carrito de compras" });
  }
});

app.post("/api/carrito", verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    const db = getDB();
    const collection = db.collection(collectionProductos);
    const usuario = req.user.CorreoElectronico;
    const datosFromBody = req.body;
    
    if (!datosFromBody.Identificador || !datosFromBody.Cantidad) {
      res
        .status(400)
        .json({ message: "Producot y su cantidad son campos requeridos" });
      return;
    }

    const producto = await collection.findOne({
      Identificador: datosFromBody.Identificador,
    });

    if (!producto) {
      res.status(404).json({ message: "Producto no encontrado :c" });
      return;
    }

    if (producto.Disponibilidad < datosFromBody.Cantidad) {
      res
        .status(400)
        .json({ message: "la cantidad solicitada del producto supera la disponibilidad" });
      return;
    }

    const carrito = await collection.findOne({ CorreoElectronico: usuario });

    if (!carrito) {
      const nuevoCarrito = {
        CorreoElectronico: usuario,
        Productos: [{ ...producto, Cantidad: datosFromBody.Cantidad }],
        Total: producto.PrecioDescuento * datosFromBody.Cantidad,
      };
      await collection.insertOne(nuevoCarrito);
    } else {
      const productoExistente = carrito.Productos.find(
        (p) => p.Identificador === producto.Identificador
      );
      if (productoExistente) {
        productoExistente.Cantidad += datosFromBody.Cantidad;
        carrito.Total += producto.PrecioDescuento * datosFromBody.Cantidad;
      } else {
        carrito.Productos.push({
          ...producto,
          Cantidad: datosFromBody.Cantidad,
        });
        carrito.Total += producto.PrecioDescuento * datosFromBody.Cantidad;
      }
      await collection.updateOne(
        { CorreoElectronico: usuario },
        { $set: carrito }
      );
    }

    const nuevaDisponibilidad =
      producto.Disponibilidad - datosFromBody.Cantidad;
    await collection.updateOne(
      { Identificador: datosFromBody.Identificador },
      { $set: { Disponibilidad: nuevaDisponibilidad } }
    );

    const carritoActualizado = await collection.findOne({
      CorreoElectronico: usuario,
    });
    res.status(200).json(carritoActualizado);
  } catch (error) {
    console.error("Error al actualizar carrito de compras:", error);
    res.status(500).json({ error: "Error al actualizar carrito de compras" });
  }
});

app.delete("/api/carrito", verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    const db = getDB();
    const collection = db.collection(collectionProductos);
    const usuario = req.user.CorreoElectronico;

    const carrito = await collection.findOne({ CorreoElectronico: usuario });

    if (!carrito || !carrito.Productos || carrito.Productos.length === 0) {
      res.status(404).json({ message: "El carrito esta vacio :c vamos a llenarlo :D" });
      return;
    }

    for (const productoCarrito of carrito.Productos) {
      const producto = await collection.findOne({
        Identificador: productoCarrito.Identificador,
      });
      if (producto) {
        const nuevaDisponibilidad =
          producto.Disponibilidad + productoCarrito.Cantidad;
        await collection.updateOne(
          { Identificador: productoCarrito.Identificador },
          { $set: { Disponibilidad: nuevaDisponibilidad } }
        );
      }
    }

    await collection.deleteOne({ CorreoElectronico: usuario });

    res.status(200).json({ message: "Oh NO! acabás de eliminar tu carrito de compras exitosamente :c" });
  } catch (error) {
    console.error("Se produjo un error al intentar eliminar carrito de compras:", error);
    res.status(500).json({ error: "Se produjo un error al intentar eliminar carrito de compras" });
  }
});

//Compra
// Ruta para realizar una compra (POST)
app.post("/api/compra", verifyToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    const db = getDB();
    const usuariosCollection = db.collection(collectionUsuarios);
    const productosCollection = db.collection(collectionProductos);
    const bitacorasCollection = db.collection(collectionbitacoras);

    const usuario = req.user.CorreoElectronico;
    console.log(req.user);    
    const carrito = await productosCollection.findOne({
      CorreoElectronico: usuario,
    });
    console.log("carrito> \n", carrito);
    if (!carrito || !carrito.Productos) {
      res.status(404).json({ message: "El carrito esta vacio :c vamos a llenarlo :D" });
      return;
    }

    for (const productoCarrito of carrito.Productos) {
      const productoInventario = await productosCollection.findOne({
        Identificador: productoCarrito.Identificador,
      });

      if (!productoInventario) {
        res
          .status(404)
          .json({ message: "El producto que acabas de buscar no se encuentra en el inventario" });
        return;
      }

      if (productoInventario.Disponibilidad < productoCarrito.Cantidad) {
        res
          .status(400)
          .json({ message: "La cantidad que solicitaste del producto excede la disponibilidad actual :c" });
        return;
      }

      const nuevaDisponibilidad =
        productoInventario.Disponibilidad - productoCarrito.Cantidad;
      await productosCollection.updateOne(
        { Identificador: productoCarrito.Identificador },
        { $set: { Disponibilidad: nuevaDisponibilidad } }
      );
    }

    const compra = {
      Usuario: usuario,
      Productos: carrito.Productos,
      Total: carrito.Total,
      Fecha: new Date(),
    };

    await bitacorasCollection.insertOne(compra);

    await usuariosCollection.deleteOne({ CorreoElectronico: usuario });

    res.status(200).json({ message: "Compra realizada con éxito :D" });
  } catch (error) {
    console.error("Error al realizar la compra, por favor vuelvelo a intentar :c:", error);
    res.status(500).json({ error: "Error al realizar la compra, por favor vuelvelo a intentar :c" });
  }
});

//Validacion de Tokens
// GET
function verifyToken(req, res, next) {
  const token = req.headers.token;
  if (!token) {
    return res.status(403).json({ message: "Token no generado" });
  }

  jwt.verify(token, "secretKey", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token generado inválido" });
    }
    req.user = decoded;
    next();
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`El servidor se está ejecutando en el puerto ${PORT}`);
});

