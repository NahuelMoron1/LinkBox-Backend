"use strict";
/** GET ACTIVE SOCIALWORKS
 * @swagger
 * /api/socialworks/socialworks/active:
 *   get:
 *     summary: Obtiene todas las obras sociales activas
 *     tags: [Socialworks]
 *     responses:
 *       200:
 *         description: Lista de obras sociales activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Omint"
 *                   active:
 *                     type: boolean
 *                     example: true
 *       404:
 *         description: No se encontraron doctores activos
 */
/** GET INACTIVE SOCIALWORKS
 * @swagger
 * /api/socialworks/socialworks/inactive:
 *   get:
 *     summary: Obtiene todas las obras sociales inactivas
 *     tags: [Socialworks]
 *     responses:
 *       200:
 *         description: Lista de obras sociales activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Omint"
 *                   active:
 *                     type: boolean
 *                     example: false
 *       404:
 *         description: No se encontraron doctores activos
 */
/** GET ALL SOCIALWORKS
 * @swagger
 * /api/socialworks/socialworks/all:
 *   get:
 *     summary: Obtiene todas las obras sociales
 *     tags: [Socialworks]
 *     responses:
 *       200:
 *         description: Lista de obras sociales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Omint"
 *                   active:
 *                     type: boolean
 *                     example: true
 *       404:
 *         description: No se encontraron doctores activos
 */
/** SET SOCIALWORK TO ACTIVE
 * @swagger
 * /api/socialworks/set/active/{id}:
 *   get:
 *     summary: Pone el estado de la obra social en activo
 *     tags: [Socialworks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la obra social
 *     responses:
 *       200:
 *         description: El estado de la obra social es ahora activo
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró un medico con estos parametros
 */
/** SET SOCIALWORK TO INACTIVE
 * @swagger
 * /api/socialworks/set/inactive/{id}:
 *   get:
 *     summary: Pone el estado de la obra social en inactivo
 *     tags: [Socialworks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la obra social
 *     responses:
 *       200:
 *         description: El estado de la obra social es ahora inactivo
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró un medico con estos parametros
 */
/** GET SOCIALWORK BY ATTENDANT
 * @swagger
 * /api/socialworks/name/{attendantID}:
 *   get:
 *     summary: Obtiene la obra social del medico
 *     tags: [Socialworks]
 *     parameters:
 *       - in: path
 *         name: attendantID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del medico
 *     responses:
 *       200:
 *         description: Obra social
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Omint"
 *                   active:
 *                     type: boolean
 *                     example: true
 *       404:
 *         description: No se encontró esta información
 */
/** GET ALL SOCIALWORKS BY ATTENDANT
 * @swagger
 * /api/socialworks/name/modify/{attendantID}:
 *   get:
 *     summary: Obtiene todas las obras sociales que cubre un medico
 *     tags: [Socialworks]
 *     parameters:
 *       - in: path
 *         name: attendantID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del medico
 *     responses:
 *       200:
 *         description: Lista de obras sociales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Omint"
 *                   active:
 *                     type: boolean
 *                     example: true
 *       404:
 *         description: No se encontró esta información
 */
/** CREATE SOCIALWORK
 * @swagger
 * /api/socialworks/:
 *   post:
 *     summary: Crear nueva obra social
 *     tags: [Socialworks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: PAMI
 *               id:
 *                 type: string
 *                 example: kvls20392kcas92oc
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Cobertura médica cargada correctamente
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 */
