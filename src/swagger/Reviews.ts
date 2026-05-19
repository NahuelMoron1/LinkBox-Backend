/** GET ATTENDANT REVIEWS
 * @swagger
 * /api/reviews/{attendantID}:
 *   get:
 *     summary: Obtener las reviews de un medico
 *     tags: [Reviews]
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
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20492945"
 *                   rating:
 *                     type: number
 *                     example: 3
 *                   comment:
 *                     type: string
 *                     example: "excellent"
 *                   dateCreated:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *       400:
 *         description: No todos los campos contienen un valor
 *       404:
 *         description: No se encontraron calificaciones
 */

/** GET USER REVIEWS
 * @swagger
 * /api/reviews/user/{userID}:
 *   get:
 *     summary: Obtener las reviews de un usuario
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de reseñas del usuario
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
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20492945"
 *                   rating:
 *                     type: number
 *                     example: 3
 *                   comment:
 *                     type: string
 *                     example: "excellent"
 *                   dateCreated:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *       400:
 *         description: No todos los campos contienen un valor
 *       404:
 *         description: No se encontraron calificaciones
 */

/** GET USER ATTENDANT REVIEW
 * @swagger
 * /api/reviews/user/attendant/{attendantID}/{userID}:
 *   get:
 *     summary: Obtener la reseña de un usuario con un medico especifico
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *       - in: path
 *         name: attendantID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del medico
 *     responses:
 *       200:
 *         description: Reseña del usuario
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
 *                   userID:
 *                     type: string
 *                     example: "44567876"
 *                   attendantID:
 *                     type: string
 *                     example: "20492945"
 *                   rating:
 *                     type: number
 *                     example: 3
 *                   comment:
 *                     type: string
 *                     example: "excellent"
 *                   dateCreated:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-08T15:00:00Z"
 *       400:
 *         description: No todos los campos contienen un valor
 *       404:
 *         description: No se encontraron calificaciones
 */

/** CREATE REVIEW
 * @swagger
 * /api/reviews/:
 *   post:
 *     summary: Agregar nueva reseña
 *     tags: [Reviews]
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
 *                   rating:
 *                     type: number
 *                     example: 3
 *                   comment:
 *                     type: string
 *                     example: may need to re-schedule
 *                 required:
 *                   - attendantID
 *                   - rating
 *     responses:
 *       200:
 *         description: reseña creada correctamente
 *       304:
 *         description: No podes agregar una calificación si sos parte del personal
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** MODIFY REVIEW
 * @swagger
 * /api/reviews/modify:
 *   post:
 *     summary: Modificar reseña existente
 *     tags: [Reviews]
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
 *                     example: vjdkdkj02032ala002cl
 *                   attendantID:
 *                     type: string
 *                     example: sjdkg4401lcla2
 *                   rating:
 *                     type: number
 *                     example: 3
 *                   comment:
 *                     type: string
 *                     example: may need to re-schedule
 *                 required:
 *                   - id
 *                   - attendantID
 *                   - rating
 *     responses:
 *       200:
 *         description: reseña modificada correctamente
 *       304:
 *         description: No podes modificar una calificación si sos parte del personal
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** DELETE REVIEW
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Eliminar reseña
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reseña
 *     responses:
 *       200:
 *         description: Calificación eliminada con exito
 *       304:
 *         description: No podes eliminar una calificación si sos parte del personal
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró la calificación
 */
