import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all role permissions
// Get all role permissions
export const getAllRolePermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.rolePermission.findMany({
      where: { isActive: true },
      orderBy: [{ role: { name: 'asc' } }, { menuPath: 'asc' }],
      include: { role: true }
    });

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Get all role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions',
    });
  }
};

// Get permissions for a specific role
export const getPermissionsByRole = async (req: Request, res: Response) => {
  try {
    const { role: roleName } = req.params;

    // Find role by name first
    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!roleRecord) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    const permissions = await prisma.rolePermission.findMany({
      where: {
        roleId: roleRecord.id,
        isActive: true,
      },
      orderBy: { menuPath: 'asc' },
    });

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Get permissions by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
    });
  }
};

// Update single permission
export const updatePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { canRead, canCreate, canUpdate, canDelete, isActive } = req.body;

    const permission = await prisma.rolePermission.update({
      where: { id },
      data: {
        canRead,
        canCreate,
        canUpdate,
        canDelete,
        isActive,
      },
    });

    res.json({
      success: true,
      data: permission,
      message: 'Permission updated successfully',
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permission',
    });
  }
};

// Bulk update permissions for a role
export const bulkUpdatePermissions = async (req: Request, res: Response) => {
  try {
    const { role: roleName } = req.params;
    const { permissions } = req.body;

    // Validate input
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array',
      });
    }

    // Find role by name first
    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!roleRecord) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Update permissions in transaction
    const updates = await prisma.$transaction(
      permissions.map((p: any) =>
        prisma.rolePermission.updateMany({
          where: {
            roleId: roleRecord.id,
            menuPath: p.menuPath,
          },
          data: {
            canRead: p.canRead,
            canCreate: p.canCreate,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
          },
        })
      )
    );

    // Fetch updated permissions
    const updatedPermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: roleRecord.id,
        isActive: true,
      },
      orderBy: { menuPath: 'asc' },
    });

    res.json({
      success: true,
      data: updatedPermissions,
      message: 'Permissions updated successfully',
    });
  } catch (error) {
    console.error('Bulk update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
    });
  }
};

// Reset permissions to defaults
export const resetToDefaults = async (req: Request, res: Response) => {
  try {
    const { role: roleName } = req.params;

    // Find role by name first
    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!roleRecord) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Define default permissions for each role
    const defaultPermissions: Record<string, any> = {
      ADMIN: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
      MANAGER: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
      CASHIER: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    };

    const defaults = defaultPermissions[roleName];
    if (!defaults) {
      return res.status(400).json({
        success: false,
        message: 'No defaults defined for this role',
      });
    }

    // Update all permissions for the role
    await prisma.rolePermission.updateMany({
      where: { roleId: roleRecord.id },
      data: defaults,
    });

    // Special case for CASHIER - disable all except dashboard, pos, transactions
    if (roleName === 'CASHIER') {
      await prisma.rolePermission.updateMany({
        where: {
          roleId: roleRecord.id,
          menuPath: {
            notIn: ['/dashboard', '/pos', '/transactions'],
          },
        },
        data: { isActive: false },
      });

      await prisma.rolePermission.updateMany({
        where: {
          roleId: roleRecord.id,
          menuPath: {
            in: ['/dashboard', '/pos', '/transactions'],
          },
        },
        data: { isActive: true },
      });

      // POS can create transactions
      await prisma.rolePermission.updateMany({
        where: {
          roleId: roleRecord.id,
          menuPath: '/pos',
        },
        data: { canCreate: true },
      });
    }

    // Special case for MANAGER - hide users menu
    if (roleName === 'MANAGER') {
      await prisma.rolePermission.updateMany({
        where: {
          roleId: roleRecord.id,
          menuPath: '/users',
        },
        data: { isActive: false },
      });
    }

    // Fetch updated permissions
    const updatedPermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: roleRecord.id,
        isActive: true,
      },
      orderBy: { menuPath: 'asc' },
    });

    res.json({
      success: true,
      data: updatedPermissions,
      message: 'Permissions reset to defaults successfully',
    });
  } catch (error) {
    console.error('Reset permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset permissions',
    });
  }
};
