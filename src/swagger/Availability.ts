/** GET ATTENDANT AVAILABILITY
 * @swagger
 * /api/availability/{attendantID}:
 *   get:
 *     summary: Obtener la disponibilidad de un medico
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: attendantID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del medico
 *     responses:
 *       200:
 *         description: Lista de reseñas del medico
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "1ckskls2020alxla"
 *                   attendantID:
 *                     type: string
 *                     example: "20492945"
 *                   dayOfWeek:
 *                     type: string
 *                     example: "Monday"
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                     example: "08:00"
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                     example: "17:00"
 *       400:
 *         description: No todos los campos contienen un valor
 *       404:
 *         description: No se encontró la disponibilidad
 */

/** CREATE AVAILABILITY
 * @swagger
 * /api/availability/:
 *   post:
 *     summary: Agregar nueva disponibilidad
 *     tags: [Availability]
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
 *                   dayOfWeek:
 *                     type: string
 *                     example: "Monday"
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                     example: "08:00"
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                     example: "17:00"
 *                 required:
 *                   - dayOfWeek
 *                   - startTime
 *                   - endTime
 *     responses:
 *       200:
 *         description: disponibilidad creada con exito
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** MODIFY AVAILABILITY
 * @swagger
 * /api/availability/modify:
 *   post:
 *     summary: modificar disponibilidad existente
 *     tags: [Availability]
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
 *                   id:
 *                     type: string
 *                     example: "kcksaklc09400llcls030c"
 *                   dayOfWeek:
 *                     type: string
 *                     example: "Monday"
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                     example: "08:00"
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                     example: "17:00"
 *                 required:
 *                   - id
 *                   - dayOfWeek
 *                   - startTime
 *                   - endTime
 *     responses:
 *       200:
 *         description: disponibilidad modificada con exito
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró la disponibilidad
 */

/** CHECK AVAILABILITY
 * @swagger
 * /api/availability/check:
 *   post:
 *     summary: verificar si un medico cuenta con disponibilidad
 *     tags: [Availability]
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
 *                     example: "kcksaklc09400llcls030c"
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T19:00:00Z"
 *                 required:
 *                   - attendantID
 *                   - date
 *     responses:
 *       200:
 *         description: "true"
 *       304:
 *         description: "false"
 */

/** DELETE AVAILABILITY
 * @swagger
 * /api/availability/{id}:
 *   delete:
 *     summary: Eliminar disponibilidad
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la disponibilidad
 *     responses:
 *       200:
 *         description: disponibilidad eliminada con exito
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró la disponibilidad
 */
