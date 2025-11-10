<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller as BaseController;
use OpenApi\Annotations as OA;

/**
 * @OA\OpenApi(
 *     @OA\Info(
 *         version="1.0.0",
 *         title="Library Management System API",
 *         description="REST API powering the LMS borrow, catalog, and admin flows."
 *     )
 * )
 */
abstract class Controller extends BaseController
{
    //
}
