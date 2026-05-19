"use strict";
/** CHECK IF COOKIE EXISTS
 * @swagger
 * /api/cookie/check/{cookieName}:
 *   get:
 *     summary: Verificar si existe una cookie
 *     tags: [Cookies]
 *     parameters:
 *       - in: path
 *         name: cookieName
 *         required: true
 *         schema:
 *           type: string
 *         description: nombre de la cookie
 *     responses:
 *       200:
 *         description: "true | false"
 */
/** GET TOKEN
 * @swagger
 * /api/cookie/get/{cookieName}:
 *   get:
 *     summary: Obtener las reviews de un medico
 *     tags: [Cookies]
 *     parameters:
 *       - in: path
 *         name: cookieName
 *         required: true
 *         schema:
 *           type: string
 *         description: nombre de la cookie
 *     responses:
 *       200:
 *         description: "Información de la cookie"
 *       401:
 *         description: "Acceso denegado"
 */
