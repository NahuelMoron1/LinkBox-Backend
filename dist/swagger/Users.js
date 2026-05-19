"use strict";
/** GET USER BY ID
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene un usuario buscado por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró el usuario
 */
/** GET ACTIVE ATTENDANTS
 * @swagger
 * /api/users/attendants/active:
 *   get:
 *     summary: Obtiene todos los médicos activos
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de médicos activos
 *       404:
 *         description: No se encontraron doctores activos
 */
/** GET INACTIVE ATTENDANTS
 * @swagger
 * /api/users/attendants/inactive:
 *   get:
 *     summary: Obtiene todos los médicos inactivos
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de médicos inactivos
 *       404:
 *         description: No se encontraron doctores inactivos
 */
/** GET ALL ATTENDANTS
 * @swagger
 * /api/users/attendants/all:
 *   get:
 *     summary: Obtiene todos los médicos registrados
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de médicos registrados
 *       404:
 *         description: No se encontraron doctores
 */
/** SET ATTENDANT TO ACTIVE
 * @swagger
 * /api/users/attendants/active/{id}:
 *   get:
 *     summary: Pone el estado del médico en activo
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: El estado del médico es ahora activo
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró un medico con estos parametros
 */
/** SET ATTENDANT TO INACTIVE
 * @swagger
 * /api/users/attendants/inactive/{id}:
 *   get:
 *     summary: Pone el estado del médico en inactivo
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: El estado del médico es ahora inactivo
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró un medico con estos parametros
 */
/** GET ATTENDANTS BY SOCIALWORK
 * @swagger
 * /api/users/attendants/socialworks/{socialworkID}:
 *   get:
 *     summary: Obtiene todos los médicos con una obra social
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: socialworkID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cobertura médica
 *     responses:
 *       200:
 *         description: Lista de médicos con una obra social
 *       400:
 *         description: No todos los campos contienen un valor
 *       404:
 *         description: No se encontraron medicos con estos parametros
 */
/** GET USER BY NAME
 * @swagger
 * /api/users/name/{username}:
 *   get:
 *     summary: Obtiene un usuario buscado por nombre
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: nombre del usuario
 *     responses:
 *       200:
 *         description: Descripción del usuario buscado
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró el usuario
 */
/** GET ALL USERS BY ADMIN
 * @swagger
 * /api/users/admin/list/{userRole}/{userStatus}:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userRole
 *         required: true
 *         schema:
 *           type: string
 *         description: rol del usuario
 *       - in: path
 *         name: userStatus
 *         required: true
 *         schema:
 *           type: string
 *         description: estado del usuario
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontraron usuarios
 */
/** CREATE USER
 * @swagger
 * /api/users/:
 *   post:
 *     summary: Creación de un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Usuario 1
 *               phone:
 *                 type: string
 *                 example: +5462882139
 *               userID:
 *                 type: string
 *                 example: 44567284
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *               file:        # 👈 este campo es el que multer recibe en req.file
 *                 type: string
 *                 format: binary
 *             required:
 *               - fullName
 *               - phone
 *               - userID
 *               - email
 *               - password
 *               - file
 *     responses:
 *       200:
 *         description: Usuario creado con exito
 *       304:
 *         description: Ya hay un usuario logueado
 *       400:
 *         description: No todos los campos contienen un valor
 *       404:
 *         description: No se encontraron usuarios
 *       500:
 *         description: Error eliminando el fondo de la imagen
 */
/** MODIFY USER
 * @swagger
 * /api/users/modify:
 *   post:
 *     summary: Modificar tu usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: Usuario 1
 *                   phone:
 *                     type: string
 *                     example: +5462882139
 *                   userID:
 *                     type: string
 *                     example: 44567284
 *                   email:
 *                     type: string
 *                     example: user@example.com
 *                   password:
 *                     type: string
 *                     format: password
 *                     example: 123456
 *                 required:
 *                   - fullName
 *                   - phone
 *                   - userID
 *                   - email
 *                   - password
 *     responses:
 *       200:
 *         description: Usuario modificado con exito
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No puede modificar datos de otro usuario || No ha iniciado sesión
 *       404:
 *         description: No se encontraron usuarios
 *       500:
 *         description: Error eliminando el fondo de la imagen
 */
/** MODIFY BY ADMIN
 * @swagger
 * /api/users/admin/modify:
 *   post:
 *     summary: Modificar un usuario existente
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Usuario modificado con exito
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No ha iniciado sesión o no tiene autorización
 *       404:
 *         description: No se encontraron usuarios
 *       500:
 *         description: Error eliminando el fondo de la imagen
 */
/** LOGIN
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: successfully logged in
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: El email o la contraseña es incorrecto
 */
/** LOGOUT
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Logged out
 */
