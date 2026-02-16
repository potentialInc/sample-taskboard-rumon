import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { UtilsService } from '@infrastructure/utils/utils.service';
import { User } from 'src/modules/users/user.entity';
import { UserRole } from 'src/shared/enums';

async function resetUsers() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);
    const utilsService = app.get(UtilsService);

    const userRepository = dataSource.getRepository(User);

    console.log('🔍 Checking existing users...');
    const existingUsers = await userRepository.find();
    console.log(`Found ${existingUsers.length} users:`);
    existingUsers.forEach((user) => {
        console.log(`  - ${user.email} (role: ${user.role})`);
    });

    console.log('\n👥 Ensuring admin user exists...');

    // Create or update Admin User
    const hashedAdminPassword = await utilsService.getHash('admin123');
    let adminUser = await userRepository.findOne({
        where: { email: 'admin@example.com' },
    });

    if (adminUser) {
        adminUser.password = hashedAdminPassword;
        adminUser.role = UserRole.ADMIN;
        adminUser.isActive = true;
        adminUser.emailVerified = true;
        await userRepository.save(adminUser);
        console.log('✅ Admin user updated: admin@example.com / admin123');
    } else {
        adminUser = userRepository.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedAdminPassword,
            role: UserRole.ADMIN,
            isActive: true,
            emailVerified: true,
        });
        await userRepository.save(adminUser);
        console.log('✅ Admin user created: admin@example.com / admin123');
    }

    // Verify password immediately
    const testAdmin = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email: 'admin@example.com' })
        .getOne();

    const isAdminPasswordValid = await utilsService.isMatchHash(
        'admin123',
        testAdmin!.password!,
    );
    console.log(
        `   Password verification: ${isAdminPasswordValid ? '✅ VALID' : '❌ INVALID'}`,
    );

    console.log(`\n✅ Admin user ready`);

    await app.close();
    console.log('\n✨ Reset completed successfully!');
}

resetUsers().catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
});
