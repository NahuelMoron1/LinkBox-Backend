/** GET ALL USER TURNS
 * @swagger
 * /api/turns/user:
 *   get:
 *     summary: Obtiene todos los turnos de un usuario
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del usuario
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET SCHEDULED USER TURNS
 * @swagger
 * /api/turns/user/scheduled:
 *   get:
 *     summary: Obtiene los turnos agendados de un usuario
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del usuario
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET COMPLETED USER TURNS
 * @swagger
 * /api/turns/user/completed:
 *   get:
 *     summary: Obtiene los turnos completados de un usuario
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del usuario
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "completed"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET CANCELLED USER TURNS
 * @swagger
 * /api/turns/user/canceled:
 *   get:
 *     summary: Obtiene los turnos cancelados de un usuario
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del usuario
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "canceled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET NOT SCHEDULED USER TURNS
 * @swagger
 * /api/turns/user/notScheduled:
 *   get:
 *     summary: Obtienelos turnos completados y cancelados de un usuario
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del usuario
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "canceled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** CREATE TURN
 * @swagger
 * /api/turns/user/create:
 *   post:
 *     summary: Crear turno
 *     tags: [Turns]
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
 *                   attendantID:
 *                     type: string
 *                     example: sjdkg4401lcla2
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: Buenos Aires
 *                   comments:
 *                     type: string
 *                     example: may need to re-schedule
 *                 required:
 *                   - attendantID
 *                   - date
 *                   - place
 *     responses:
 *       200:
 *         description: Turno creado con exito
 *       304:
 *         description: Not available
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET ALL ATTENDANT TURNS
 * @swagger
 * /api/turns/attendant:
 *   get:
 *     summary: Obtiene todos los turnos de un médico
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del medico
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET ATTENDANT USER TURNS
 * @swagger
 * /api/turns/attendant/scheduled:
 *   get:
 *     summary: Obtiene los turnos agendados de un medico
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del medico
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET COMPLETED ATTENDANT TURNS
 * @swagger
 * /api/turns/attendant/completed:
 *   get:
 *     summary: Obtiene los turnos completados de un medico
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del medico
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "completed"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET CANCELED ATTENDANT TURNS
 * @swagger
 * /api/turns/attendant/canceled:
 *   get:
 *     summary: Obtiene los turnos cancelados de un medico
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del medico
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "canceled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** CANCEL TURN
 * @swagger
 * /api/turns/attendant/cancel/{id}:
 *   get:
 *     summary: Pone el estado del turno en cancelado
 *     tags: [Turns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del turno
 *     responses:
 *       200:
 *         description: Turno cancelado con exito
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró un turno con estos parametros
 */

/** COMPLETE TURN
 * @swagger
 * /api/turns/attendant/complete/{id}:
 *   get:
 *     summary: Pone el estado del turno en completado
 *     tags: [Turns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del turno
 *     responses:
 *       200:
 *         description: Turno completado con exito
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró un turno con estos parametros
 */

/** ATTENDANT CREATE TURN
 * @swagger
 * /api/turns/attendant/create:
 *   post:
 *     summary: Crear turno como médico
 *     tags: [Turns]
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
 *                   userID:
 *                     type: string
 *                     example: sjdkg4401lcla2
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: Buenos Aires
 *                   comments:
 *                     type: string
 *                     example: may need to re-schedule
 *                 required:
 *                   - userID
 *                   - date
 *                   - place
 *     responses:
 *       200:
 *         description: Turno creado con exito
 *       304:
 *         description: Not available
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** ADD COMMENTS ADMIN
 * @swagger
 * /api/turns/turns/comments/{turnID}:
 *   post:
 *     summary: Añadir comentarios
 *     tags: [Turns]
 *     parameters:
 *       - in: path
 *         name: turnID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del turnos
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
 *                   comments:
 *                     type: string
 *                     example: may need to re-schedule
 *                 required:
 *                   - comments
 *     responses:
 *       200:
 *         description: Turno modificado con exito
 *       400:
 *         description: No todos los campos contienen un valor || Los comentarios deben ser de tipo texto
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró el turno
 */

/** GET ATTENDANT TURNS BY DATE
 * @swagger
 * /api/turns/turns/attendant/{attendantID}:
 *   post:
 *     summary: Obtener turnos de un medico por fecha
 *     tags: [Turns]
 *     parameters:
 *       - in: path
 *         name: attendantID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del medico
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
 *                   startHour:
 *                     type: string
 *                   endHour:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T19:00:00Z"
 *                 required:
 *                   - startHour
 *                   - endHour
 *                   - date
 *     responses:
 *       200:
 *         description: Turno modificado con exito
 *       400:
 *         description: No todos los campos contienen un valor || Los comentarios deben ser de tipo texto
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró el turno
 */

/** GET ALL USER TURNS
 * @swagger
 * /api/turns/user:
 *   get:
 *     summary: Obtiene todos los turnos de un usuario
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos del usuario
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET SCHEDULED ADMIN TURNS
 * @swagger
 * /api/turns/admin/scheduled:
 *   get:
 *     summary: Obtiene los turnos agendados siendo administrador
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET COMPLETED ADMIN TURNS
 * @swagger
 * /api/turns/admin/completed:
 *   get:
 *     summary: Obtiene los turnos completados siendo administrador
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "completed"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** GET CANCELED ADMIN TURNS
 * @swagger
 * /api/turns/admin/canceled:
 *   get:
 *     summary: Obtiene los turnos cancelados siendo administrador
 *     tags: [Turns]
 *     responses:
 *       200:
 *         description: Lista de turnos
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
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *                   place:
 *                     type: string
 *                     example: "Buenos Aires"
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20345678"
 *                   status:
 *                     type: string
 *                     example: "canceled"
 *                   comments:
 *                     type: string
 *                     example: "excellent"
 *       404:
 *         description: No se encontraron turnos
 *       401:
 *         description: No tiene permiso para ver esta información
 */
