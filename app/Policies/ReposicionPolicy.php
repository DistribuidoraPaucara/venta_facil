<?php

namespace App\Policies;

use App\Models\Reposicion;
use App\Models\User;

class ReposicionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('inventario.reposiciones.index');
    }

    public function view(User $user, Reposicion $reposicion): bool
    {
        return $user->empresa_id === $reposicion->empresa_id && $user->can('inventario.reposiciones.show');
    }

    public function create(User $user): bool
    {
        return $user->can('inventario.reposiciones.create');
    }

    public function update(User $user, Reposicion $reposicion): bool
    {
        return $user->empresa_id === $reposicion->empresa_id && $user->can('inventario.reposiciones.edit');
    }

    public function delete(User $user, Reposicion $reposicion): bool
    {
        return $user->empresa_id === $reposicion->empresa_id && $user->can('inventario.reposiciones.delete');
    }

    public function restore(User $user, Reposicion $reposicion): bool
    {
        return false;
    }

    public function forceDelete(User $user, Reposicion $reposicion): bool
    {
        return false;
    }
}
