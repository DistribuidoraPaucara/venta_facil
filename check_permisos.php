<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::find(17);
echo "Usuario: " . $user->name . "\n";
echo "Empresa: " . $user->empresa->nombre . "\n\n";

echo "Roles:\n";
foreach ($user->roles as $role) {
    echo "  - " . $role->name . "\n";
}

echo "\nPermisos directos:\n";
foreach ($user->permissions as $perm) {
    echo "  - " . $perm->name . "\n";
}

echo "\nTiene inventario.reposiciones.create? ";
echo $user->hasPermissionTo('inventario.reposiciones.create') ? "SÍ ✅\n" : "NO ❌\n";

echo "Tiene inventario.reposiciones.index? ";
echo $user->hasPermissionTo('inventario.reposiciones.index') ? "SÍ ✅\n" : "NO ❌\n";
