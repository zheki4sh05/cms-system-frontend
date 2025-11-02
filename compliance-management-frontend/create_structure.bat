@echo off
echo Creating folder structure...

:: App layer
mkdir src\app\providers
mkdir src\app\styles

:: Pages layer
mkdir src\pages\auth\LoginPage
mkdir src\pages\manager\DashboardPage
mkdir src\pages\manager\IncidentsPage
mkdir src\pages\manager\CasesPage
mkdir src\pages\manager\TasksPage
mkdir src\pages\supervisor\DashboardPage
mkdir src\pages\supervisor\CasesPage
mkdir src\pages\supervisor\IncidentsPage
mkdir src\pages\supervisor\AnalyticsPage
mkdir src\pages\supervisor\RulesPage
mkdir src\pages\executive\DashboardPage
mkdir src\pages\executive\ReportsPage
mkdir src\pages\NotFoundPage

:: Widgets layer
mkdir src\widgets\Header
mkdir src\widgets\Sidebar
mkdir src\widgets\IncidentCard
mkdir src\widgets\CaseCard

:: Features layer
mkdir src\features\auth\model
mkdir src\features\auth\ui
mkdir src\features\incident-management\model
mkdir src\features\incident-management\ui
mkdir src\features\case-management\model
mkdir src\features\case-management\ui
mkdir src\features\action-plan\model
mkdir src\features\action-plan\ui

:: Entities layer
mkdir src\entities\incident\model
mkdir src\entities\incident\ui
mkdir src\entities\case\model
mkdir src\entities\case\ui
mkdir src\entities\user\model
mkdir src\entities\user\ui
mkdir src\entities\vendor\model
mkdir src\entities\vendor\ui
mkdir src\entities\action-item\model
mkdir src\entities\action-item\ui

:: Shared layer
mkdir src\shared\ui\Button
mkdir src\shared\ui\Input
mkdir src\shared\ui\Card
mkdir src\shared\ui\Table
mkdir src\shared\ui\Modal
mkdir src\shared\lib\api
mkdir src\shared\lib\hooks
mkdir src\shared\lib\utils
mkdir src\shared\lib\store
mkdir src\shared\config
mkdir src\shared\types

echo Folder structure created successfully!
pause