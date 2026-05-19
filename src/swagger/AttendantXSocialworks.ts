/** CREATE ATTENDANT_X_SOCIALWORKS
 * @swagger
 * /api/attendantXSocialwork/:
 *   post:
 *     summary: Agregar nueva cobertura médica para un doctor
 *     tags: [Attendant_Socialworks]
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
 *                     example: "lkcjscls02033lclw0"
 *                   socialworkID:
 *                     type: string
 *                     example: "jkdvslkdk002olsls028484kv"
 *                   id:
 *                     type: string
 *                     format: date-time
 *                     example: "lckclrjf99jfofeij9585498dkd"
 *                 required:
 *                   - attendantID
 *                   - socialworkID
 *                   - id
 *     responses:
 *       200:
 *         description: Cobertura médica del doctor cargada correctamente
 *       400:
 *         description: Error en la carga de datos
 *       401:
 *         description: No tiene permiso para ver esta información
 */

/** DELETE ATTENDANT_X_SOCIALWORKS
 * @swagger
 * /api/attendantXSocialwork/delete/{attendantID}/{socialworkID}:
 *   delete:
 *     summary: Eliminar cobertura médica de un doctor
 *     tags: [Attendant_Socialworks]
 *     parameters:
 *       - in: path
 *         name: attendantID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del médico
 *       - in: path
 *         name: socialworkID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la obra social
 *     responses:
 *       200:
 *         description: Información borrada correctamente
 *       400:
 *         description: No todos los campos contienen un valor
 *       401:
 *         description: No tiene permiso para ver esta información
 *       404:
 *         description: No se encontró esta información
 */
