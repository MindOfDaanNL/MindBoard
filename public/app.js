/* ============================================================================
   MindBoard SPA — vanilla JS, hash-router, PWA-vriendelijk
   ============================================================================ */

// API-basis: standaard relatief ('/api'). Overschrijfbaar via window.MB_API_BASE
// (bijv. in capacitor/www voor een Android-app die naar een externe server wijst).
const API = (window.MB_API_BASE || '/api').replace(/\/$/, '');

const state = {
  token: localStorage.getItem('mb_token') || null,
  user: JSON.parse(localStorage.getItem('mb_user') || 'null'),
  current: { route: '#/dashboard', data: null },
  overview: null,
  theme: localStorage.getItem('mb_theme') || 'light',
  lang: localStorage.getItem('mb_lang') || 'nl'
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Taal / i18n ---------------- */
const I18N = {
  nl: {
    app_tagline: 'Projectbeheer · rollen · kanban',
    save: 'Opslaan',
    cancel: 'Annuleer',
    create: 'Aanmaken',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    add: 'Toevoegen',
    send: 'Verstuur',
    close: 'Sluiten',
    ok: 'Oké',
    back: 'Terug',
    search: 'Zoeken',
    required: 'verplicht',
    saved: 'Opgeslagen',
    noData: 'Geen gegevens',
    optional: 'optioneel',
    choose: 'Kies',
    manage: 'Beheren',
    readAll: 'Alles gelezen',
    yes: 'Ja',
    no: 'Nee',

    login_tab: 'Inloggen',
    register_tab: 'Account maken',
    login_title: 'Inloggen',
    register_title: 'Account aanmaken',
    login_email: 'E-mail of gebruikersnaam',
    login_password: 'Wachtwoord',
    reg_email: 'E-mailadres',
    reg_username: 'Gebruikersnaam',
    reg_fullname: 'Volledige naam (optioneel)',
    reg_password: 'Wachtwoord (min. 8 tekens)',
    login_btn: 'Inloggen',
    register_btn: 'Account aanmaken',

    topbar_menu: 'Menu',
    topbar_theme: 'Donker/licht thema',
    topbar_notifications: 'Notificaties',
    topbar_account: 'Account',
    search_placeholder: 'Zoek taken, projecten…',
    settings: 'Instellingen',
    logout: 'Uitloggen',
    dashboard: 'Dashboard',
    organizations: 'Organisaties',
    projects: 'Projecten',
    admin: 'Beheer',
    notifications: 'Notificaties',
    new_org: 'Nieuwe organisatie',
    no_orgs: 'Nog geen organisaties',
    no_projects: 'Geen projecten',
    no_projects_in_org: 'Nog geen projecten in deze organisatie',

    hello: 'Hallo',
    new_project: 'Nieuw project',
    org: 'Organisatie',
    stat_projects: 'Projecten',
    stat_done: 'Taken afgerond',
    stat_my_tasks: 'Jouw taken',
    stat_overdue: 'Verlopen',
    stat_unread: 'Ongelezen',
    my_tasks: 'Jouw taken',
    open: 'open',
    recent_activity: 'Recente activiteit',
    orgs_card: 'Organisaties',
    no_open_tasks: 'Geen open taken toegewezen',
    no_activity: 'Nog geen activiteit',
    create_org: 'Maak een organisatie aan',
    members: 'Leden',
    member_count: 'leden',
    projects_count: 'projecten',

    act_created: 'maakte taak',
    act_moved: 'verplaatste',
    act_deleted: 'verwijderde taak',
    act_commented: 'reageerde op',
    act_assigned: 'wees toe',

    new_org_title: 'Nieuwe organisatie',
    org_name: 'Naam',
    org_desc: 'Beschrijving',
    org_edit: 'Organisatie bewerken',
    org_delete_confirm: 'Organisatie echt verwijderen? Alle projecten gaan verloren.',
    org_deleted: 'Organisatie verwijderd',
    org_created: 'aangemaakt',
    org_invite: 'Uitnodigen',
    org_invite_title: 'Lid uitnodigen',
    invite_email: 'E-mailadres',
    invite_role: 'Rol',
    invite_hint: 'De genodigde krijgt een uitnodigingslink die hij/zij kan accepteren na inloggen.',
    invite_send: 'Uitnodigen',
    invite_email_required: 'E-mail verplicht',
    invite_created: 'Uitnodiging aangemaakt',
    invite_title2: 'Uitnodiging',
    invite_link_hint: 'Stuur deze link naar',
    invite_valid: 'Link is 7 dagen geldig. Deel deze via e-mail of chat.',
    invite_copy: 'Kopieer',
    invite_copied: 'Link gekopieerd',
    role_updated: 'Rol bijgewerkt',
    member_remove_confirm: 'Lid verwijderen?',
    member_removed: 'Lid verwijderd',
    role: 'Rol',
    remove: 'Verwijderen',
    member_add: 'Lid toevoegen',
    member_add_hint: 'Kies een organisatielid om aan dit project toe te voegen.',
    member: 'Lid',
    no_members_available: '(geen leden beschikbaar)',
    member_added: 'Lid toegevoegd',

    project: 'Project',
    new_project_title: 'Nieuw project',
    project_org: 'Organisatie',
    project_name: 'Naam',
    first_board_name: 'Eerste bord naam',
    project_desc: 'Beschrijving',
    project_color: 'Kleur',
    project_edit: 'Project bewerken',
    project_archive: 'Project archiveren (verbergt uit overzichten)',
    project_delete_confirm: 'Project echt verwijderen?',
    project_deleted: 'Project verwijderd',
    project_members: 'Projectleden',
    activity: 'Activiteit',
    metrics: 'Statistieken',
    metric_tasks: 'Taken',
    metric_open: 'Open',
    metric_done: 'Klaar',
    metric_created_done: 'Aangemaakt vs. klaar (14 dagen)',
    metric_by_assignee: 'Taken per persoon',
    metric_by_column: 'Per kolom',
    export_csv: 'Export CSV',
    new_board: 'Nieuw bord',
    board: 'Bord',
    board_new_title: 'Nieuw bord',
    board_name: 'Naam',
    board_deleted: 'Bord verwijderd',
    board_delete_confirm: 'Bord verwijderen? Alle taken gaan verloren.',
    column: 'Kolom',
    new_column: 'Nieuwe kolom',
    edit_column: 'Kolom bewerken',
    column_name: 'Naam',
    column_color: 'Kleur',
    wip_limit: 'WIP-limiet (optioneel)',
    column_delete_confirm: 'Kolom verwijderen? Taken in deze kolom gaan verloren.',
    column_deleted: 'Kolom verwijderd',
    columns_reordered: 'Kolommen herordend',
    add_column: 'Kolom',
    delete_board: 'Bord',

    new_task: 'Nieuwe taak',
    edit_task: 'Taak bewerken',
    task_title: 'Titel',
    task_desc: 'Beschrijving',
    task_priority: 'Prioriteit',
    task_due: 'Deadline',
    task_column: 'Kolom',
    task_assignee: 'Toegewezen aan',
    task_tags: 'Tags (komma gescheiden, max 5)',
    task_recurrence: 'Herhaling',
    recurrence_none: 'Geen',
    recurrence_daily: 'Dagelijks',
    recurrence_weekly: 'Wekelijks',
    recurrence_monthly: 'Maandelijks',
    recurrence_interval: 'Elke',
    recurrence_end: 'Einddatum (optioneel)',
    recurring: 'herhalend',
    task_title_required: 'Titel is verplicht',
    task_created: 'Taak aangemaakt',
    task_saved: 'Taak opgeslagen',
    task_deleted: 'Taak verwijderd',
    task_delete_confirm: 'Taak echt verwijderen?',
    task_moved: 'Taak verplaatst',
    assignee_none: '— niemand —',
    template_optional: 'Template (optioneel)',
    template_none: '— Geen template —',
    template_manage: 'Templates beheren…',
    template_contains: 'Template bevat',
    template_auto: 'automatisch aangemaakt na het opslaan.',
    manage_templates: 'Eigen templates beheren',
    no_custom_templates: 'Nog geen eigen templates',
    new_template: 'Nieuw template aanmaken',
    new_template_title: 'Nieuw template aanmaken',
    template_name: 'Naam',
    template_icon: 'Icoon',
    template_desc: 'Beschrijving',
    template_title_prefix: 'Standaard titel prefix',
    template_desc_template: 'Beschrijving template (Markdown)',
    template_priority: 'Standaard prioriteit',
    template_tags: 'Tags (komma gescheiden)',
    template_checklists: 'Checklists (JSON, optioneel)',
    template_checklists_hint: 'Checklists formaat: array van objecten met title en items (array van strings)',
    template_created: 'Template aangemaakt',
    template_save_fail: 'Kon template niet bewaren',
    template_delete_confirm: 'Template verwijderen?',
    template_deleted: 'Template verwijderd',
    template_delete_err: 'Fout bij verwijderen',
    template_name_required: 'Naam is verplicht',

    back_to_board: 'Terug naar bord',
    task: 'Taak',
    created_by: 'Aangemaakt door',
    created_on: 'op',
    modified: 'gewijzigd',
    column_label: 'Kolom',
    deadline: 'Deadline',
    assigned: 'Toegewezen',
    description: 'Beschrijving',
    checklists: 'Checklists',
    done_count: 'klaar',
    checklist_add: 'Checklist toevoegen',
    checklist_new_name: 'Bijv. Stappenplan',
    checklist_created: 'Checklist aangemaakt',
    checklist_delete_confirm: 'Checklist verwijderen?',
    item_delete_confirm: 'Item verwijderen?',
    checklist_name_required: 'Naam is verplicht',
    item_title_required: 'Titel is verplicht',
    new_item: 'Nieuw item…',
    comments: 'Reacties',
    no_comments: 'Nog geen reacties',
    comment_placeholder: 'Typ een reactie…',
    comment_empty: 'Reactie mag niet leeg zijn',
    comment_sent: 'Reactie geplaatst',
    comment_deleted: 'Reactie verwijderd',
    comment_delete_confirm: 'Reactie verwijderen?',

    profile: 'Profiel',
    full_name: 'Volledige naam',
    avatar_color: 'Avatar-kleur (fallback als geen afbeelding)',
    change_password: 'Wachtwoord wijzigen',
    current_password: 'Huidig wachtwoord',
    new_password: 'Nieuw wachtwoord (min 8)',
    current_password_required: 'Vul huidig wachtwoord in',
    profile_saved: 'Profiel opgeslagen',
    avatar_updated: 'Avatar geüpdatet',
    avatar_upload_hint: 'Klik op de avatar om een foto te uploaden',
    avatar_only_images: 'Alleen afbeeldingen toegestaan',
    avatar_max_size: 'Maximaal 2MB',
    avatar_upload_fail: 'Upload mislukt',
    language: 'Taal / Language',
    language_hint: 'Kies de taal van de interface',
    notif_prefs: 'Notificatievoorkeuren',
    notif_prefs_hint: 'Kies welke notificaties je wilt ontvangen',
    notif_type_assignment: 'Toewijzingen',
    notif_type_comment: 'Reacties',
    notif_type_mention: 'Vermeldingen (@)',
    notif_type_info: 'Overige',

    admin_panel: 'Beheerpaneel',
    users: 'Gebruikers',
    new_users_7d: 'Nieuwe gebruikers (7d)',
    user: 'Gebruiker',
    email: 'E-mail',
    status: 'Status',
    created: 'Aangemaakt',
    action: 'Actie',
    disable: 'Uitschakelen',
    activate: 'Activeren',
    you: 'jij',
    top_orgs: 'Top organisaties',
    disabled: 'uitgeschakeld',
    enabled: 'geactiveerd',
    role_updated2: 'Rol bijgewerkt',
    user_disabled: 'Gebruiker uitgeschakeld',
    user_enabled: 'Gebruiker geactiveerd',

    no_access: 'Geen toegang',
    invitation_accepting: 'Uitnodiging accepteren…',
    welcome_org: 'Welkom bij',
    invitation_error: 'Uitnodiging niet gevonden of al gebruikt',
    go_dashboard: 'Naar dashboard',
    notif_read_all: 'Alles gelezen',
    notif_empty: 'Geen notificaties',
    notif_deleted: 'Verwijderd',
    notif_delete_confirm: 'Notificatie verwijderen?',
    notifications_title: 'Notificaties',

    loading_error: 'Kan geen data laden:',
    retry: 'Opnieuw proberen',
    error: 'Fout',
    unknown_error: 'onbekende fout',
    reload: 'Opnieuw laden',
    filter_placeholder: 'Filter taken…',
    filter_prio_all: 'Prioriteit: alle',
    filter_assignee_all: 'Toegewezen aan: iedereen',
    save_filter: 'Filter bewaren',
    saved_filters: 'Opgeslagen filters…',
    filter_name_prompt: 'Naam voor dit filter:',
    filter_saved: 'Filter opgeslagen',
    filter_save_fail: 'Kon filter niet bewaren',
    filter_applied: 'toegepast',
    view_toggle: 'Weergave',
    view_board: 'Bord',
    view_list: 'Lijst',
    urgent: 'Urgent',
    high: 'Hoog',
    medium: 'Middel',
    low: 'Laag',

    shortcuts_title: 'Toetsencombinaties',
    shortcut: 'Sneltoets',
    shortcuts: [
      ['G → D', 'Dashboard'],
      ['G → O', 'Organisaties'],
      ['G → P', 'Projecten'],
      ['G → S', 'Instellingen'],
      ['G → N', 'Notificaties'],
      ['/', 'Zoekfocus'],
      ['N', 'Nieuwe taak (op bord/project/org)'],
      ['Esc', 'Sluit modal/dropdown'],
      ['?', 'Toon deze lijst'],
      ['Cmd/Ctrl + K', 'Command Palette']
    ],
    no_commands: 'Geen commando\'s gevonden',
    palette_placeholder: 'Typ een commando…',
    go_to_board: 'Ga naar een bord, project of organisatie om een taak aan te maken',

    time_justnow: 'zojuist',
    time_min: 'min geleden',
    time_hr: 'u geleden',
    time_d: 'd geleden',
    date_today: 'Vandaag',
    session_expired: 'Sessie verlopen, log opnieuw in',
    theme_switch: 'Thema wisselen',
    manage_templates_short: 'Templates beheren',
    created_by_prefix: 'Aangemaakt door',
    task_has: 'Taak #'
  },
  en: {
    app_tagline: 'Project management · roles · kanban',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    send: 'Send',
    close: 'Close',
    ok: 'OK',
    back: 'Back',
    search: 'Search',
    required: 'required',
    saved: 'Saved',
    noData: 'No data',
    optional: 'optional',
    choose: 'Choose',
    manage: 'Manage',
    readAll: 'Read all',
    yes: 'Yes',
    no: 'No',

    login_tab: 'Log in',
    register_tab: 'Create account',
    login_title: 'Log in',
    register_title: 'Create account',
    login_email: 'Email or username',
    login_password: 'Password',
    reg_email: 'Email address',
    reg_username: 'Username',
    reg_fullname: 'Full name (optional)',
    reg_password: 'Password (min. 8 characters)',
    login_btn: 'Log in',
    register_btn: 'Create account',

    topbar_menu: 'Menu',
    topbar_theme: 'Dark/light theme',
    topbar_notifications: 'Notifications',
    topbar_account: 'Account',
    search_placeholder: 'Search tasks, projects…',
    settings: 'Settings',
    logout: 'Log out',
    dashboard: 'Dashboard',
    organizations: 'Organizations',
    projects: 'Projects',
    admin: 'Admin',
    notifications: 'Notifications',
    new_org: 'New organization',
    no_orgs: 'No organizations yet',
    no_projects: 'No projects',
    no_projects_in_org: 'No projects in this organization yet',

    hello: 'Hello',
    new_project: 'New project',
    org: 'Organization',
    stat_projects: 'Projects',
    stat_done: 'Tasks completed',
    stat_my_tasks: 'Your tasks',
    stat_overdue: 'Overdue',
    stat_unread: 'Unread',
    my_tasks: 'Your tasks',
    open: 'open',
    recent_activity: 'Recent activity',
    orgs_card: 'Organizations',
    no_open_tasks: 'No open tasks assigned',
    no_activity: 'No activity yet',
    create_org: 'Create an organization',
    members: 'Members',
    member_count: 'members',
    projects_count: 'projects',

    act_created: 'created task',
    act_moved: 'moved',
    act_deleted: 'deleted task',
    act_commented: 'commented on',
    act_assigned: 'assigned',

    new_org_title: 'New organization',
    org_name: 'Name',
    org_desc: 'Description',
    org_edit: 'Edit organization',
    org_delete_confirm: 'Really delete this organization? All projects will be lost.',
    org_deleted: 'Organization deleted',
    org_created: 'created',
    org_invite: 'Invite',
    org_invite_title: 'Invite member',
    invite_email: 'Email address',
    invite_role: 'Role',
    invite_hint: 'The invitee receives an invitation link they can accept after logging in.',
    invite_send: 'Invite',
    invite_email_required: 'Email is required',
    invite_created: 'Invitation created',
    invite_title2: 'Invitation',
    invite_link_hint: 'Send this link to',
    invite_valid: 'Link is valid for 7 days. Share it via email or chat.',
    invite_copy: 'Copy',
    invite_copied: 'Link copied',
    role_updated: 'Role updated',
    member_remove_confirm: 'Remove member?',
    member_removed: 'Member removed',
    role: 'Role',
    remove: 'Remove',
    member_add: 'Add member',
    member_add_hint: 'Choose an organization member to add to this project.',
    member: 'Member',
    no_members_available: '(no members available)',
    member_added: 'Member added',

    project: 'Project',
    new_project_title: 'New project',
    project_org: 'Organization',
    project_name: 'Name',
    first_board_name: 'First board name',
    project_desc: 'Description',
    project_color: 'Color',
    project_edit: 'Edit project',
    project_archive: 'Archive project (hides from overviews)',
    project_delete_confirm: 'Really delete this project?',
    project_deleted: 'Project deleted',
    project_members: 'Project members',
    activity: 'Activity',
    metrics: 'Metrics',
    metric_tasks: 'Tasks',
    metric_open: 'Open',
    metric_done: 'Done',
    metric_created_done: 'Created vs. done (14 days)',
    metric_by_assignee: 'Tasks per person',
    metric_by_column: 'Per column',
    export_csv: 'Export CSV',
    new_board: 'New board',
    board: 'Board',
    board_new_title: 'New board',
    board_name: 'Name',
    board_deleted: 'Board deleted',
    board_delete_confirm: 'Delete board? All tasks will be lost.',
    column: 'Column',
    new_column: 'New column',
    edit_column: 'Edit column',
    column_name: 'Name',
    column_color: 'Color',
    wip_limit: 'WIP limit (optional)',
    column_delete_confirm: 'Delete column? Tasks in this column will be lost.',
    column_deleted: 'Column deleted',
    columns_reordered: 'Columns reordered',
    add_column: 'Column',
    delete_board: 'Board',

    new_task: 'New task',
    edit_task: 'Edit task',
    task_title: 'Title',
    task_desc: 'Description',
    task_priority: 'Priority',
    task_due: 'Due date',
    task_column: 'Column',
    task_assignee: 'Assignee',
    task_tags: 'Tags (comma separated, max 5)',
    task_recurrence: 'Recurrence',
    recurrence_none: 'None',
    recurrence_daily: 'Daily',
    recurrence_weekly: 'Weekly',
    recurrence_monthly: 'Monthly',
    recurrence_interval: 'Every',
    recurrence_end: 'End date (optional)',
    recurring: 'recurring',
    task_title_required: 'Title is required',
    task_created: 'Task created',
    task_saved: 'Task saved',
    task_deleted: 'Task deleted',
    task_delete_confirm: 'Really delete this task?',
    task_moved: 'Task moved',
    assignee_none: '— nobody —',
    template_optional: 'Template (optional)',
    template_none: '— No template —',
    template_manage: 'Manage templates…',
    template_contains: 'Template contains',
    template_auto: 'will be created automatically after saving.',
    manage_templates: 'Manage custom templates',
    no_custom_templates: 'No custom templates yet',
    new_template: 'Create new template',
    new_template_title: 'Create new template',
    template_name: 'Name',
    template_icon: 'Icon',
    template_desc: 'Description',
    template_title_prefix: 'Default title prefix',
    template_desc_template: 'Description template (Markdown)',
    template_priority: 'Default priority',
    template_tags: 'Tags (comma separated)',
    template_checklists: 'Checklists (JSON, optional)',
    template_checklists_hint: 'Checklist format: array of objects with title and items (array of strings)',
    template_created: 'Template created',
    template_save_fail: 'Could not save template',
    template_delete_confirm: 'Delete template?',
    template_deleted: 'Template deleted',
    template_delete_err: 'Error deleting',
    template_name_required: 'Name is required',

    back_to_board: 'Back to board',
    task: 'Task',
    created_by: 'Created by',
    created_on: 'on',
    modified: 'modified',
    column_label: 'Column',
    deadline: 'Due date',
    assigned: 'Assignee',
    description: 'Description',
    checklists: 'Checklists',
    done_count: 'done',
    checklist_add: 'Add checklist',
    checklist_new_name: 'e.g. Steps',
    checklist_created: 'Checklist created',
    checklist_delete_confirm: 'Delete checklist?',
    item_delete_confirm: 'Delete item?',
    checklist_name_required: 'Name is required',
    item_title_required: 'Title is required',
    new_item: 'New item…',
    comments: 'Comments',
    no_comments: 'No comments yet',
    comment_placeholder: 'Type a comment…',
    comment_empty: 'Comment cannot be empty',
    comment_sent: 'Comment posted',
    comment_deleted: 'Comment deleted',
    comment_delete_confirm: 'Delete comment?',

    profile: 'Profile',
    full_name: 'Full name',
    avatar_color: 'Avatar color (fallback if no image)',
    change_password: 'Change password',
    current_password: 'Current password',
    new_password: 'New password (min 8)',
    current_password_required: 'Enter your current password',
    profile_saved: 'Profile saved',
    avatar_updated: 'Avatar updated',
    avatar_upload_hint: 'Click the avatar to upload a photo',
    avatar_only_images: 'Images only',
    avatar_max_size: 'Maximum 2MB',
    avatar_upload_fail: 'Upload failed',
    language: 'Language',
    language_hint: 'Choose the interface language',
    notif_prefs: 'Notification preferences',
    notif_prefs_hint: 'Choose which notifications you want to receive',
    notif_type_assignment: 'Assignments',
    notif_type_comment: 'Comments',
    notif_type_mention: 'Mentions (@)',
    notif_type_info: 'Other',

    admin_panel: 'Admin panel',
    users: 'Users',
    new_users_7d: 'New users (7d)',
    user: 'User',
    email: 'Email',
    status: 'Status',
    created: 'Created',
    action: 'Action',
    disable: 'Disable',
    activate: 'Activate',
    you: 'you',
    top_orgs: 'Top organizations',
    disabled: 'disabled',
    enabled: 'enabled',
    role_updated2: 'Role updated',
    user_disabled: 'User disabled',
    user_enabled: 'User enabled',

    no_access: 'No access',
    invitation_accepting: 'Accepting invitation…',
    welcome_org: 'Welcome to',
    invitation_error: 'Invitation not found or already used',
    go_dashboard: 'Go to dashboard',
    notif_read_all: 'Read all',
    notif_empty: 'No notifications',
    notif_deleted: 'Deleted',
    notif_delete_confirm: 'Delete notification?',
    notifications_title: 'Notifications',

    loading_error: 'Could not load data:',
    retry: 'Try again',
    error: 'Error',
    unknown_error: 'unknown error',
    reload: 'Reload',
    filter_placeholder: 'Filter tasks…',
    filter_prio_all: 'Priority: all',
    filter_assignee_all: 'Assigned to: everyone',
    save_filter: 'Save filter',
    saved_filters: 'Saved filters…',
    filter_name_prompt: 'Name for this filter:',
    filter_saved: 'Filter saved',
    filter_save_fail: 'Could not save filter',
    filter_applied: 'applied',
    view_toggle: 'View',
    view_board: 'Board',
    view_list: 'List',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',

    shortcuts_title: 'Keyboard shortcuts',
    shortcut: 'Shortcut',
    shortcuts: [
      ['G → D', 'Dashboard'],
      ['G → O', 'Organizations'],
      ['G → P', 'Projects'],
      ['G → S', 'Settings'],
      ['G → N', 'Notifications'],
      ['/', 'Search focus'],
      ['N', 'New task (on board/project/org)'],
      ['Esc', 'Close modal/dropdown'],
      ['?', 'Show this list'],
      ['Cmd/Ctrl + K', 'Command Palette']
    ],
    no_commands: 'No commands found',
    palette_placeholder: 'Type a command…',
    go_to_board: 'Go to a board, project or organization to create a task',

    time_justnow: 'just now',
    time_min: 'min ago',
    time_hr: 'h ago',
    time_d: 'd ago',
    date_today: 'Today',
    session_expired: 'Session expired, please log in again',
    theme_switch: 'Switch theme',
    manage_templates_short: 'Manage templates',
    created_by_prefix: 'Created by',
    task_has: 'Task #'
  }
};

const t = (key) => (I18N[state.lang] && I18N[state.lang][key]) || I18N.nl[key] || key;

function setLang(lang) {
  if (lang !== 'nl' && lang !== 'en') return;
  state.lang = lang;
  localStorage.setItem('mb_lang', lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'nl';
  translateStatic();
  if (typeof renderTopbar === 'function') renderTopbar();
  renderSidebar();
}

function translateStatic() {
  $$('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  $$('[data-i18n-ph]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  $$('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.title = state.lang === 'en' ? 'MindBoard · Project Management' : 'MindBoard · Projectbeheer';
}

// API-foutmeldingen vertalen (NL → EN)
const API_ERRORS_EN = {
  'Ongeldige inloggegevens': 'Invalid credentials',
  'email, username en password zijn verplicht': 'Email, username and password are required',
  'Ongeldig e-mailadres': 'Invalid email address',
  'Gebruikersnaam: 3-32 tekens, alleen letters, cijfers, _ en .': 'Username: 3-32 characters, only letters, numbers, _ and .',
  'Wachtwoord moet minimaal 8 tekens zijn': 'Password must be at least 8 characters',
  'E-mail of gebruikersnaam is al in gebruik': 'Email or username is already in use',
  'Niet ingelogd': 'Not logged in',
  'Sessie verlopen of ongeldig': 'Session expired or invalid',
  'Sessie verlopen, log opnieuw in': 'Session expired, please log in again',
  'Account is uitgeschakeld': 'Account is disabled',
  'Account bestaat niet meer': 'Account no longer exists',
  'Alleen voor beheerders': 'Admins only',
  'Alleen admin/member mag taken aanmaken': 'Only admin/member can create tasks',
  'Alleen admin/member mag taken bewerken': 'Only admin/member can edit tasks',
  'Alleen admin/member mag taken verwijderen': 'Only admin/member can delete tasks',
  'Alleen admin/member mag taken verplaatsen': 'Only admin/member can move tasks',
  'Alleen admin/member mag checklists aanmaken': 'Only admin/member can create checklists',
  'Alleen admin/member mag items toevoegen': 'Only admin/member can add items',
  'Alleen admin/member mag items bewerken': 'Only admin/member can edit items',
  'Alleen admin/member mag items verwijderen': 'Only admin/member can delete items',
  'Alleen admin/member mag checklists verwijderen': 'Only admin/member can delete checklists',
  'Taak niet gevonden': 'Task not found',
  'Geen toegang tot deze taak': 'No access to this task',
  'Comment mag niet leeg zijn': 'Comment cannot be empty',
  'Comment niet gevonden': 'Comment not found',
  'Geen rechten om dit comment te verwijderen': 'No permission to delete this comment',
  'Titel is verplicht': 'Title is required',
  'Naam is verplicht': 'Name is required',
  'Bord niet gevonden': 'Board not found',
  'Bord heeft geen kolommen': 'Board has no columns',
  'Kolom niet gevonden op dit bord': 'Column not found on this board',
  'columnId is verplicht': 'columnId is required',
  'Niets om bij te werken': 'Nothing to update',
  'Ongeldige prioriteit': 'Invalid priority',
  'Checklist niet gevonden': 'Checklist not found',
  'Item niet gevonden': 'Item not found',
  'Een bord heeft minimaal 1 kolom nodig': 'A board needs at least 1 column',
  'Kolom niet gevonden': 'Column not found',
  'Geen rechten': 'No permission',
  'Organisatie niet gevonden': 'Organization not found',
  'Geen lid van deze organisatie': 'Not a member of this organization',
  'Minimaal rol': 'Minimum role',
  'vereist': 'required',
  'orgId ontbreekt': 'orgId missing',
  'projectId ontbreekt': 'projectId missing',
  'Geen toegang tot dit project': 'No access to this project',
  'Geen toegang tot dit bord': 'No access to this board',
  'Alleen admin/member mag borden aanmaken': 'Only admin/member can create boards',
  'projectId is verplicht': 'projectId is required',
  'boardId is verplicht': 'boardId is required',
  'Gebruiker niet gevonden': 'User not found',
  'Ongeldige rol': 'Invalid role',
  'Ongeldige status': 'Invalid status',
  'Je kunt je eigen account niet uitschakelen': 'You cannot disable your own account',
  'Gebruiker is geen lid van deze organisatie': 'User is not a member of this organization',
  'Lid niet gevonden': 'Member not found',
  'Alleen de eigenaar kan de eigenaar-rol wijzigen': 'Only the owner can change the owner role',
  'De eigenaar kan niet verwijderd worden': 'The owner cannot be removed',
  'Admin kan zichzelf niet verwijderen': 'Admin cannot remove themselves',
  'Er is al een openstaande uitnodiging voor dit e-mailadres': 'There is already a pending invitation for this email',
  'Uitnodiging niet gevonden of al gebruikt': 'Invitation not found or already used',
  'Uitnodiging is verlopen': 'Invitation has expired',
  'Deze uitnodiging is niet voor jouw account': 'This invitation is not for your account',
  'orgId is verplicht (query parameter)': 'orgId is required (query parameter)',
  'Te veel verzoeken. Even wachten en opnieuw proberen.': 'Too many requests. Wait a moment and try again.',
  'Huidig wachtwoord is onjuist': 'Current password is incorrect',
  'Geen bestand geüpload': 'No file uploaded',
  'Alleen afbeeldingen toegestaan': 'Images only',
  'Maximaal 2MB': 'Maximum 2MB',
  'Alleen PNG, JPG, WEBP, GIF toegestaan': 'Only PNG, JPG, WEBP, GIF allowed',
  'Geen organisaties': 'No organizations'
};
const apiError = (msg) => {
  if (state.lang !== 'en' || !msg) return msg;
  if (API_ERRORS_EN[msg]) return API_ERRORS_EN[msg];
  const wip = msg.match(/^WIP-limiet bereikt \((\d+)\) in "(.+)"$/);
  if (wip) return `WIP limit reached (${wip[1]}) in "${wip[2]}"`;
  return msg;
};

/* ---------------- SVG icons ---------------- */
const ICONS = {
  dashboard: '<circle cx="12" cy="12" r="3"/><path d="M3 12c0 0 3.5-7 9-7s9 7 9 7-3.5 7-9 7-9-7-9-7z"/>',
  org: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  project: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  arrowBack: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  clipboard: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>',
  tag: '<path d="M20.6 13.4L12 22l-9-9V4a1 1 0 0 1 1-1h9l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'
};
function icon(name, size = 18) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------------- API helper ---------------- */
async function api(path, opts = {}, retried = false) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(API + path, { ...opts, headers, credentials: 'include' });
  if (res.status === 401 && state.token && path !== '/auth/login' && !retried) {
    await refreshToken();
    return api(path, opts, true);
  }
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) {
    const err = new Error(apiError(data?.error) || `Fout ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function refreshToken() {
  const res = await fetch(API + '/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    // Sessie echt verlopen → token opschonen en naar de login-pagina
    state.token = null;
    state.user = null;
    state.overview = null;
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    showAuth();
    throw new Error(t('session_expired'));
  }
  const data = await res.json();
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('mb_token', data.token);
  localStorage.setItem('mb_user', JSON.stringify(data.user));
}

function setSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('mb_token', token);
  localStorage.setItem('mb_user', JSON.stringify(user));
}

function logout(silent = false) {
  state.token = null;
  state.user = null;
  state.overview = null;
  localStorage.removeItem('mb_token');
  localStorage.removeItem('mb_user');
  fetch(API + '/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  if (!silent) showAuth();
}

/* ---------------- Toasts ---------------- */
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-root').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------------- Keyboard Shortcuts & Command Palette ---------------- */
const KEYMAP = {
  'g d': '#dashboard',
  'g o': '#orgs',
  'g p': '#projects',
  'g s': '#settings',
  'g n': '#notifications',
  '/': 'search',
  'n': 'newTask',
  'escape': 'closeModal',
  '?': 'showShortcuts'
};

let shortcutSequence = '';
let shortcutTimer = null;

function handleKeyboardShortcut(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();
  if (key === 'escape') {
    closeModal();
    $('#user-dropdown').classList.add('hidden');
    $('#notif-panel').classList.add('hidden');
    $('#search-results').classList.add('hidden');
    closeSidebar();
    return;
  }

  if (key === '/') {
    e.preventDefault();
    $('#search-input').focus();
    return;
  }

  if (key === '?') {
    showShortcutsModal();
    return;
  }

  if (key === 'n') {
    if (location.hash.startsWith('#/board/')) {
      const boardId = location.hash.split('/')[2];
      const board = state.current.board?.board;
      if (board) {
        const boardData = { board, columns: state.current.board.columns, members: state.current.board.members };
        showTaskModal(boardData.board, boardData.columns, boardData.members, null);
      }
    } else if (location.hash.startsWith('#/project/')) {
      showProjectModal();
    } else if (location.hash.startsWith('#/org/')) {
      showOrgModal();
    }
    return;
  }

  shortcutSequence += ` ${key}`;
  shortcutSequence = shortcutSequence.trim();
  clearTimeout(shortcutTimer);
  shortcutTimer = setTimeout(() => { shortcutSequence = ''; }, 1500);

  if (KEYMAP[shortcutSequence]) {
    e.preventDefault();
    const action = KEYMAP[shortcutSequence];
    if (action.startsWith('#')) {
      location.hash = action;
    } else if (action === 'newTask') {
      // handled above
    }
    shortcutSequence = '';
  }
}

function showShortcutsModal() {
  const shortcuts = t('shortcuts');
  openModal(`
    <div class="modal-header"><h2>${t('shortcuts_title')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="text-align:left;color:var(--ink2);border-bottom:1px solid var(--border)"><th style="padding:8px 12px">${t('shortcut')}</th><th style="padding:8px 12px">${t('settings')}</th></tr></thead>
        <tbody>
          ${shortcuts.map(([k, a]) => `<tr style="border-bottom:1px solid var(--bg)"><td style="padding:8px 12px;font-family:monospace;background:var(--bg);border-radius:4px">${esc(k)}</td><td style="padding:8px 12px">${esc(a)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`);
}

function openCommandPalette() {
  const commands = [
    { id: 'dashboard', label: t('dashboard'), icon: 'dashboard', action: () => location.hash = '#/dashboard' },
    { id: 'orgs', label: t('organizations'), icon: 'org', action: () => location.hash = '#/orgs' },
    { id: 'projects', label: t('projects'), icon: 'project', action: () => location.hash = '#/projects' },
    { id: 'notifications', label: t('notifications'), icon: 'bell', action: () => location.hash = '#/notifications' },
    { id: 'settings', label: t('settings'), icon: 'settings', action: () => location.hash = '#/settings' },
    { id: 'new-task', label: t('new_task'), icon: 'plus', action: () => {
      if (location.hash.startsWith('#/board/')) {
        const boardData = state.current.board;
        if (boardData) showTaskModal(boardData.board, boardData.columns, boardData.members, null);
      } else if (location.hash.startsWith('#/project/')) showProjectModal();
      else if (location.hash.startsWith('#/org/')) showOrgModal();
      else toast(t('go_to_board'), 'error');
    }},
    { id: 'new-project', label: t('new_project'), icon: 'project', action: () => showProjectModal() },
    { id: 'new-org', label: t('new_org'), icon: 'org', action: () => showOrgModal() },
    { id: 'theme', label: t('theme_switch'), icon: state.theme === 'dark' ? 'sun' : 'moon', action: () => setTheme(state.theme === 'dark' ? 'light' : 'dark') },
    { id: 'shortcuts', label: t('shortcuts_title'), icon: 'alert', action: () => showShortcutsModal() },
  ];

  let filtered = commands;
  let selectedIndex = 0;

  const paletteItem = (cmd, i) => `
    <button class="palette-item ${i === selectedIndex ? 'selected' : ''}" data-cmd="${cmd.id}">
      <span class="p-ic">${icon(cmd.icon, 18)}</span>
      <span>${esc(cmd.label)}</span>
    </button>`;

  openModal(`
    <div class="modal-header" style="padding:12px 16px;border-bottom:none">
      <div style="display:flex;align-items:center;gap:8px;width:100%">
        ${icon('search', 18)}
        <input id="palette-input" type="search" placeholder="${t('palette_placeholder')}" autocomplete="off" autofocus />
        <span class="palette-kbd">⌘K</span>
      </div>
    </div>
    <div class="modal-body" style="padding:0;max-height:400px;overflow-y:auto" id="palette-list">
      ${filtered.map(paletteItem).join('')}
      <div class="palette-empty hidden">${t('no_commands')}</div>
    </div>`);

  const input = $('#palette-input');
  const list = $('#palette-list');

  const renderList = () => {
    list.innerHTML = filtered.map(paletteItem).join('') + `<div class="palette-empty hidden">${t('no_commands')}</div>`;
    if (!filtered.length) $('.palette-empty').classList.remove('hidden');
    $$('.palette-item').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        filtered[i].action();
        closeModal();
      });
      btn.addEventListener('mouseenter', () => { selectedIndex = i; renderList(); });
    });
    const selected = $('.palette-item.selected');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    filtered = commands.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q));
    selectedIndex = 0;
    renderList();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1); renderList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); renderList(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIndex]) { filtered[selectedIndex].action(); closeModal(); } }
    else if (e.key === 'Escape') { closeModal(); }
  });

  input.focus();
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
  } else {
    handleKeyboardShortcut(e);
  }
});

/* ---------------- Avatar/initials ---------------- */
function initials(user) {
  const full = user?.fullName || user?.full_name || user?.username || '?';
  return full.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function avatarHTML(user, size = 30) {
  if (user?.avatarUrl || user?.avatar_url) {
    return `<img class="avatar" src="${esc(user.avatarUrl || user.avatar_url)}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" />`;
  }
  const color = user?.avatarColor || user?.avatar_color || '#4f46e5';
  return `<span class="avatar" style="background:${esc(color)};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px">${esc(initials(user))}</span>`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const locale = state.lang === 'en' ? 'en-US' : 'nl-NL';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T00:00:00') : new Date(iso);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return t('time_justnow');
  if (s < 3600) return `${Math.floor(s / 60)} ${t('time_min')}`;
  if (s < 86400) return `${Math.floor(s / 3600)} ${t('time_hr')}`;
  if (s < 604800) return `${Math.floor(s / 86400)} ${t('time_d')}`;
  return fmtDate(iso);
}

function renderMarkdown(text) {
  if (!text) return '';
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let listOpen = false;
  let listOrdered = false;
  const closeList = () => { if (listOpen) { html += listOrdered ? '</ol>' : '</ul>'; listOpen = false; } };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { closeList(); continue; }

    if (/^```/.test(trimmed)) {
      closeList();
      const rest = lines.slice(i + 1);
      const end = rest.findIndex((l) => /^```/.test(l.trim()));
      const body = (end === -1 ? rest : rest.slice(0, end)).join('\n');
      html += `<pre><code>${esc(body)}</code></pre>`;
      i += (end === -1 ? rest.length : end + 1);
      continue;
    }
    let m;
    if ((m = /^(#{1,6})\s+(.*)$/.exec(trimmed))) {
      closeList();
      const lvl = m[1].length;
      html += `<h${lvl}>${inline(m[2])}</h${lvl}>`;
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      closeList();
      const inner = trimmed.replace(/^>\s?/, '');
      html += `<blockquote>${inline(inner)}</blockquote>`;
      continue;
    }
    const ordered = /^\d+[.)]\s+/.test(trimmed);
    const unordered = /^[-*]\s+/.test(trimmed);
    if (ordered || unordered) {
      if (!listOpen) {
        listOrdered = ordered;
        html += listOrdered ? '<ol>' : '<ul>';
        listOpen = true;
      } else if (listOrdered !== ordered) {
        closeList();
        listOrdered = ordered;
        html += listOrdered ? '<ol>' : '<ul>';
        listOpen = true;
      }
      html += `<li>${inline(trimmed.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, ''))}</li>`;
      continue;
    }
    closeList();
    html += `<p>${inline(trimmed)}</p>`;
  }
  closeList();
  return html;

  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, (m, label, href) => {
        const safe = /^(https?:|mailto:)/i.test(href.trim()) ? href.trim() : '#';
        return `<a href="${safe}" target="_blank" rel="noopener">${label}</a>`;
      });
  }
}

function priorityChip(p) {
  const labels = { low: t('low'), medium: t('medium'), high: t('high'), urgent: t('urgent') };
  return `<span class="priority-chip priority-${esc(p || 'medium')}">${labels[p] || labels.medium}</span>`;
}

/* ---------------- Modal helper ---------------- */
function openModal(html) {
  $('#modal-root').innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">${html}</div>
    </div>`;
  $('#modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
}

function closeModal() {
  $('#modal-root').innerHTML = '';
}

/* ---------------- Auth view ---------------- */
function showAuth() {
  $('#view-auth').classList.remove('hidden');
  $('#view-app').classList.add('hidden');
  renderAuthTab('login');
}

function renderAuthTab(tab) {
  $$('.auth-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $('#form-login').classList.toggle('hidden', tab !== 'login');
  $('#form-register').classList.toggle('hidden', tab !== 'register');
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('mb_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('#btn-theme');
  if (btn) btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon', 20);
}

/* ---------------- App shell ---------------- */
function showApp() {
  $('#view-auth').classList.add('hidden');
  $('#view-app').classList.remove('hidden');
  $('#sidebar').classList.remove('hidden');
  $('#bottom-nav').classList.remove('hidden');
  renderTopbar();
}

function renderTopbar() {
  const u = state.user;
  if (!u) return;
  $('#btn-user').innerHTML = avatarHTML(u, 38);
  $('#dropdown-user').innerHTML = `
    <div class="dropdown-user-avatar" style="width:36px;height:36px">${avatarHTML(u, 36)}</div>
    <div class="dropdown-user-info">
      <div class="name">${esc(u.fullName || u.username)}</div>
      <div class="email">${esc(u.email)}</div>
    </div>`;
  $('#btn-logout').onclick = () => logout();
  if (u.role === 'admin') {
    $('.admin-only').classList.remove('hidden');
  } else {
    $('.admin-only').classList.add('hidden');
  }
  loadNotifications();
}

function toggleSidebar() {
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const sidebar = $('#sidebar');
  const backdrop = $('#sidebar-backdrop');
  if (mobile) {
    const isOpen = sidebar.classList.toggle('open');
    backdrop.classList.toggle('visible', isOpen);
    backdrop.classList.toggle('hidden', !isOpen);
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

function closeSidebar() {
  const sidebar = $('#sidebar');
  const backdrop = $('#sidebar-backdrop');
  sidebar.classList.remove('open');
  backdrop.classList.remove('visible');
  backdrop.classList.add('hidden');
}

function renderSidebar() {
  const orgs = state.overview?.orgs || [];
  $('#sidebar-orgs').innerHTML = `
    <div class="sidebar-org-title">${t('organizations')}</div>
    ${orgs.length ? orgs.map((o) => `
      <button data-nav="#/org/${o.id}" class="nav-item sidebar-org-item ${location.hash === `#/org/${o.id}` ? 'active' : ''}">
        <span class="dot">${esc(initials({ fullName: o.name, username: o.name }))}</span> <span>${esc(o.name)}</span>
      </button>`).join('') : `<div class="nav-item" style="color:var(--ink3);font-size:13px">${t('no_orgs')}</div>`}`;
}

async function loadNotifications() {
  try {
    const d = await api('/notifications');
    const badge = $('#notif-badge');
    badge.classList.toggle('hidden', d.unread === 0);
    badge.textContent = d.unread;
    renderNotifications(d.notifications);
  } catch (e) { /* negeer */ }
}

function notifIcon(type) {
  const map = { assignment: 'user', comment: 'comment', mention: 'at', info: 'bell' };
  return icon(map[type] || 'bell', 16);
}

function renderNotifications(items) {
  $('#notif-list').innerHTML = items.length
    ? items.map((n) => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-link="${esc(n.link || '')}" ${n.link ? 'style="cursor:pointer"' : ''}>
        <span class="notif-ic">${notifIcon(n.type)}</span>
        <span class="notif-body">
          <span class="n-title">${esc(n.title)}</span>
          ${n.body ? `<span class="n-body">${esc(n.body)}</span>` : ''}
          <span class="n-time">${timeAgo(n.created_at)}</span>
        </span>
      </div>`).join('')
    : `<div class="notif-empty"><div class="big">📭</div>${t('notif_empty')}</div>`;

  $$('#notif-list .notif-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const id = el.dataset.id;
      await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
      const link = el.getAttribute('data-link');
      if (link) { location.hash = link; $('#notif-panel').classList.add('hidden'); }
      loadNotifications();
    });
  });
}

/* ---------------- Notificaties pagina ---------------- */
async function renderNotificationsPage(main) {
  const d = await api('/notifications?limit=100');
  const { notifications, total } = d;

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('bell', 22)} ${t('notifications_title')} <span class="sub">${total}</span></div>
      <div class="page-actions">
        ${notifications.some((n) => !n.is_read) ? `<button class="btn-ghost" id="np-read-all">${icon('check', 16)} ${t('notif_read_all')}</button>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
        ${notifications.length ? notifications.map((n) => `
          <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-link="${esc(n.link || '')}" ${n.link ? 'style="cursor:pointer"' : ''}>
            <span class="notif-ic">${notifIcon(n.type)}</span>
            <span class="notif-body">
              <span class="n-title">${esc(n.title)}</span>
              ${n.body ? `<span class="n-body">${esc(n.body)}</span>` : ''}
              <span class="n-time">${timeAgo(n.created_at)}</span>
            </span>
            <button class="btn-ghost btn-sm" data-np-del="${n.id}" title="${t('delete')}" style="margin-left:auto;flex-shrink:0">${icon('trash', 13)}</button>
          </div>`).join('')
        : `<div class="notif-empty"><div class="big">📭</div>${t('notif_empty')}</div>`}
      </div>
    </div>`;

  $('#np-read-all')?.addEventListener('click', async () => {
    await api('/notifications/read-all', { method: 'POST' });
    toast(t('notif_read_all'));
    renderNotificationsPage(main);
  });

  $$('#main .notif-item').forEach((el) => {
    el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-np-del]')) return;
      const id = el.dataset.id;
      await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
      const link = el.getAttribute('data-link');
      if (link) location.hash = link;
      else renderNotificationsPage(main);
    });
  });

  $$('[data-np-del]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm(t('notif_delete_confirm'))) return;
    await api(`/notifications/${btn.dataset.npDel}`, { method: 'DELETE' });
    toast(t('notif_deleted'));
    renderNotificationsPage(main);
  }));
}

/* ---------------- Router ---------------- */
const routes = {
  '#/dashboard': renderDashboard,
  '#/orgs': renderOrgs,
  '#/org': renderOrg,
  '#/projects': renderProjects,
  '#/project': renderProject,
  '#/board': renderBoard,
  '#/task': renderTask,
  '#/notifications': renderNotificationsPage,
  '#/settings': renderSettings,
  '#/admin': renderAdmin,
  '#/accept': renderAccept
};

async function router() {
  const hash = location.hash || '#/dashboard';
  if (!state.token) return showAuth();

  showApp();
  let main = $('#main');
  main.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    await loadOverview();
  } catch (e) {
    if (e.status === 401) return showAuth();
    main.innerHTML = `<div class="empty-state"><div class="big">⚠️</div>${t('loading_error')} ${esc(e.message)}<br><br><button class="btn-primary" onclick="location.reload()">${t('retry')}</button></div>`;
    return;
  }
  renderSidebar();

  const [path = 'dashboard', id] = hash.replace(/^#\/?/, '').split('/');
  const render = routes[`#/${path}`] || renderDashboard;

  $$('.nav-item[data-nav]').forEach((n) => n.classList.toggle('active', n.dataset.nav === `#/${path}` || (path === 'org' && n.dataset.nav === `#/orgs`)));
  $$('.bottom-nav-item[data-nav]').forEach((n) => n.classList.toggle('active', n.dataset.nav === `#/${path}` || (path === 'org' && n.dataset.nav === `#/orgs`)));
  closeSidebar();

  try {
    await render(main, { path, id });
  } catch (e) {
    main.innerHTML = `<div class="empty-state"><div class="big">⚠️</div>${esc(e.message)}</div>`;
  }
}

async function loadOverview() {
  if (state.overview) return state.overview;
  state.overview = await api('/users/me/overview');
  state.user = state.overview.user;
  localStorage.setItem('mb_user', JSON.stringify(state.user));
  renderTopbar();
  return state.overview;
}

function invalidateOverview() {
  state.overview = null;
}

/* ============================================================================
   Views
   ============================================================================ */

async function renderDashboard(main) {
  const d = state.overview;
  const tasks = d.myTasks || [];
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date()).length;
  const done = d.projects.reduce((s, p) => s + (p.done_count || 0), 0);
  const total = d.projects.reduce((s, p) => s + (p.task_count || 0), 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const todayStr = new Date().toLocaleDateString(state.lang === 'en' ? 'en-US' : 'nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">👋 ${t('hello')}, ${esc(state.user.fullName || state.user.username)}!
        <span class="sub">${todayStr}</span>
      </div>
      <div class="page-actions">
        <button class="btn-primary" id="btn-dash-project">${icon('plus', 16)} ${t('new_project')}</button>
        <button class="btn-ghost" id="btn-dash-org">${icon('org', 16)} ${t('org')}</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-icon stat-icon-blue">${icon('project', 20)}</span>
        <div class="stat-value">${d.projects.length}</div>
        <div class="stat-label">${t('stat_projects')}</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon stat-icon-green">${icon('check', 20)}</span>
        <div class="stat-value">${done}<span class="stat-total">/${total}</span></div>
        <div class="stat-label">${t('stat_done')}</div>
        <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
      </div>
      <div class="stat-card">
        <span class="stat-icon stat-icon-purple">${icon('user', 20)}</span>
        <div class="stat-value">${tasks.length}</div>
        <div class="stat-label">${t('stat_my_tasks')}</div>
      </div>
      <div class="stat-card ${overdue > 0 ? 'stat-card-warn' : ''}">
        <span class="stat-icon ${overdue > 0 ? 'stat-icon-red' : 'stat-icon-amber'}">${icon('alert', 20)}</span>
        <div class="stat-value">${overdue}</div>
        <div class="stat-label">${t('stat_overdue')}</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon stat-icon-amber">${icon('bell', 20)}</span>
        <div class="stat-value">${d.unreadNotifications}</div>
        <div class="stat-label">${t('stat_unread')}</div>
      </div>
    </div>

    <div class="grid-2-1">
      <div>
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">${icon('clipboard', 16)} ${t('my_tasks')}</span> <span class="card-count">${tasks.length} ${t('open')}</span></div>
          <div class="card-body" style="padding:0">
            ${tasks.length ? tasks.map((t) => `
              <div class="task-list-item" data-task="${t.id}">
                ${avatarHTML(state.user, 30)}
                <div style="flex:1">
                  <div class="t-title">${esc(t.title)}</div>
                  <div class="t-meta"><span class="dot-sep">${esc(t.project_name)}</span> · ${esc(t.column_name)} ${t.due_date ? `· <span class="${new Date(t.due_date) < new Date() ? 'k-due overdue' : 'k-due'}">${icon('clock', 12)} ${fmtDate(t.due_date)}</span>` : ''}</div>
                </div>
                ${priorityChip(t.priority)}
              </div>`).join('') : `<div class="empty-state"><div class="big">🎉</div>${t('no_open_tasks')}</div>`}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">${icon('activity', 16)} ${t('recent_activity')}</span></div>
          <div class="activity-list">
            ${(d.recentActivity || []).map((a) => `
              <div class="activity-item">
                ${avatarHTML({ fullName: a.full_name, username: a.username, avatarColor: a.avatar_color, avatarUrl: a.avatar_url }, 28)}
                <div class="a-text"><strong>${esc(a.full_name || a.username)}</strong> ${activityText(a)}</div>
                <div class="a-time">${timeAgo(a.created_at)}</div>
              </div>`).join('') || `<div class="empty-state">${t('no_activity')}</div>`}
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-header"><span class="card-title">${icon('org', 16)} ${t('orgs_card')}</span></div>
          <div class="card-body" style="padding:0">
            ${d.orgs.map((o) => `
              <div class="task-list-item" data-nav="#/org/${o.id}">
                <span class="org-tile">${esc(initials({ fullName: o.name, username: o.name }))}</span>
                <div style="flex:1">
                  <div class="t-title">${esc(o.name)}</div>
                  <div class="t-meta">${o.member_count} ${t('member_count')}</div>
                </div>
                <span class="role-pill" style="position:static">${esc(o.role)}</span>
              </div>`).join('') || `<div class="empty-state"><div class="big">🏢</div>${t('create_org')}</div>`}
          </div>
        </div>
      </div>
    </div>`;

  $$('#main [data-task]').forEach((el) => el.addEventListener('click', () => { location.hash = `#/task/${el.dataset.task}`; }));
  $('#btn-dash-project').addEventListener('click', () => showProjectModal());
  $('#btn-dash-org').addEventListener('click', () => showOrgModal());
}

function activityText(a) {
  const map = {
    'task.created': `${t('act_created')} <em>"${esc(a.entity_name)}"</em>`,
    'task.moved': `${t('act_moved')} <em>"${esc(a.entity_name)}"</em>`,
    'task.deleted': `${t('act_deleted')} <em>"${esc(a.entity_name)}"</em>`,
    'task.commented': `${t('act_commented')} <em>"${esc(a.entity_name)}"</em>`,
    'task.assigned': `${t('act_assigned')} <em>"${esc(a.entity_name)}"</em>`
  };
  return map[a.action] || `${esc(a.action)} · ${esc(a.entity_name || '')}`;
}

/* ---------------- Organisaties ---------------- */
async function renderOrgs(main) {
  const { orgs } = await api('/orgs');
  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('org', 22)} ${t('organizations')} <span class="sub">${orgs.length}</span></div>
      <div class="page-actions"><button class="btn-primary" id="btn-new-org2">${icon('plus', 16)} ${t('new_org')}</button></div>
    </div>
    <div class="org-grid">
      ${orgs.map((o) => `
        <div class="org-card" data-nav="#/org/${o.id}">
          <span class="role-pill">${esc(o.role)}</span>
          <div class="org-icon org-tile-big">${esc(initials({ fullName: o.name, username: o.name }))}</div>
          <h3>${esc(o.name)}</h3>
          <p>${esc(o.description || t('noData'))}</p>
          <div class="meta">
            <span>${icon('user', 13)} ${o.member_count} ${t('member_count')}</span>
            <span>${icon('project', 13)} ${o.project_count} ${t('projects_count')}</span>
          </div>
        </div>`).join('') || `<div class="empty-state"><div class="big">🏢</div>${t('no_orgs')}<br><br><button class="btn-primary" id="btn-new-org3">${t('create_org')}</button></div>`}
    </div>`;
  $('#btn-new-org2')?.addEventListener('click', () => showOrgModal());
  $('#btn-new-org3')?.addEventListener('click', () => showOrgModal());
}

function showOrgModal() {
  openModal(`
    <div class="modal-header"><h2>${t('new_org_title')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>${t('org_name')} *</label>
      <input id="org-name" placeholder="Bijv. ACME B.V." autocomplete="organization" />
      <label>${t('org_desc')}</label>
      <textarea id="org-desc" rows="3" placeholder="Waar houdt deze organisatie zich mee bezig?"></textarea>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="org-create">${t('create')}</button>
      </div>
    </div>`);
  $('#org-create').addEventListener('click', async () => {
    try {
      const { org } = await api('/orgs', { method: 'POST', body: JSON.stringify({ name: $('#org-name').value, description: $('#org-desc').value }) });
      toast(`${t('org')} "${org.name}" ${t('org_created')}`);
      closeModal();
      invalidateOverview();
      location.hash = `#/org/${org.id}`;
    } catch (e) { toast(apiError(e.message), 'error'); }
  });
}

/* ---------------- Org detail ---------------- */
async function renderOrg(main, { id }) {
  const orgId = Number(id);
  const data = await api(`/orgs/${orgId}`);
  const { org, members, projects } = data;
  const isAdmin = ['owner', 'admin'].includes(data.myRole);
  const isOwner = data.myRole === 'owner';

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('org', 22)} ${esc(org.name)} <span class="sub">${esc(org.slug)}</span></div>
      <div class="page-actions">
        ${isAdmin ? `<button class="btn-primary" id="btn-proj-${orgId}">${icon('plus', 16)} ${t('new_project')}</button>
        <button class="btn-ghost" id="btn-invite">${icon('mail', 16)} ${t('org_invite')}</button>
        <button class="btn-ghost" id="btn-edit-org">${icon('edit', 16)} ${t('edit')}</button>` : ''}
        ${isOwner ? `<button class="btn-danger" id="btn-del-org">${icon('trash', 16)} ${t('delete')}</button>` : ''}
      </div>
    </div>
    ${org.description ? `<p style="color:var(--ink2);margin-bottom:20px">${esc(org.description)}</p>` : ''}

    <div class="grid-2-1">
      <div>
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">${icon('project', 16)} ${t('projects')}</span> <span class="card-count">${projects.length}</span></div>
          <div class="card-body" style="padding:0">
            ${projects.length ? projects.map((p) => `
              <div class="task-list-item" data-nav="#/project/${p.id}">
                <span class="org-tile" style="font-size:15px">${esc(p.icon || '📋')}</span>
                <div style="flex:1">
                  <div class="t-title">${esc(p.name)}</div>
                  <div class="t-meta">${p.board_count} ${t('board').toLowerCase()}s · ${p.task_count} ${t('task').toLowerCase()}s</div>
                </div>
                <span class="dot" style="width:10px;height:10px;border-radius:50%;background:${esc(p.color)};display:inline-block;flex-shrink:0"></span>
              </div>`).join('') : `<div class="empty-state"><div class="big">📂</div>${t('no_projects_in_org')}</div>`}
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-header"><span class="card-title">${icon('user', 16)} ${t('members')}</span> <span class="card-count">${members.length}</span></div>
          <div class="member-list">
            ${members.map((m) => `
              <div class="member-row" data-uid="${m.id}">
                ${avatarHTML(m, 30)}
                <div class="m-info">
                  <div class="m-name">${esc(m.fullName || m.username)} ${m.id === org.owner_id ? '👑' : ''}</div>
                  <div class="m-email">${esc(m.email)}</div>
                </div>
                ${isAdmin && m.role !== 'owner' ? `
                  <select class="role-select" data-uid="${m.id}">
                    ${['admin', 'member', 'viewer'].map((r) => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                  </select>
                  ${isAdmin ? `<button class="btn-ghost btn-sm" data-remove="${m.id}">✕</button>` : ''}`
                  : `<span class="role-pill" style="position:static">${esc(m.role)}</span>`}
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  $('#btn-proj-' + orgId)?.addEventListener('click', () => showProjectModal(orgId));
  $('#btn-invite')?.addEventListener('click', () => showInviteModal(orgId));
  $('#btn-edit-org')?.addEventListener('click', () => showEditOrgModal(org, orgId));
  $('#btn-del-org')?.addEventListener('click', async () => {
    if (!confirm(t('org_delete_confirm'))) return;
    await api(`/orgs/${orgId}`, { method: 'DELETE' });
    toast(t('org_deleted'));
    invalidateOverview();
    location.hash = '#/orgs';
  });
  $$('.role-select').forEach((sel) => sel.addEventListener('change', async () => {
    await api(`/orgs/${orgId}/members/${sel.dataset.uid}`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) });
    toast(t('role_updated'));
  }));
  $$('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(t('member_remove_confirm'))) return;
    await api(`/orgs/${orgId}/members/${b.dataset.remove}`, { method: 'DELETE' });
    toast(t('member_removed'));
    renderOrg(main, { id });
  }));
}

function showEditOrgModal(org, orgId) {
  openModal(`
    <div class="modal-header"><h2>${t('org_edit')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>${t('org_name')}</label>
      <input id="eorg-name" value="${esc(org.name)}" autocomplete="organization" />
      <label>${t('org_desc')}</label>
      <textarea id="eorg-desc" rows="3">${esc(org.description || '')}</textarea>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="eorg-save">${t('save')}</button>
      </div>
    </div>`);
  $('#eorg-save').addEventListener('click', async () => {
    await api(`/orgs/${orgId}`, { method: 'PATCH', body: JSON.stringify({ name: $('#eorg-name').value, description: $('#eorg-desc').value }) });
    toast(t('saved'));
    closeModal();
    invalidateOverview();
    router();
  });
}

function showInviteModal(orgId) {
  openModal(`
    <div class="modal-header"><h2>${t('org_invite_title')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>${t('invite_email')}</label>
      <input id="inv-email" type="email" placeholder="collega@bedrijf.nl" autocomplete="email" />
      <label>${t('invite_role')}</label>
      <select id="inv-role">
        <option value="member">member</option>
        <option value="admin">admin</option>
        <option value="viewer">viewer</option>
      </select>
      <p style="font-size:12px;color:var(--ink2);margin-top:8px">${t('invite_hint')}</p>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="inv-send">${t('invite_send')}</button>
      </div>
    </div>`);
  $('#inv-send').addEventListener('click', async () => {
    try {
      const email = $('#inv-email').value;
      if (!email) return toast(t('invite_email_required'), 'error');
      const { invitation } = await api(`/orgs/${orgId}/invitations`, { method: 'POST', body: JSON.stringify({ email, role: $('#inv-role').value }) });
      const link = `${location.origin}#/accept/${invitation.token}`;
      toast(t('invite_created'));
      closeModal();
      openModal(`
        <div class="modal-header"><h2>${t('invite_title2')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
          <p style="margin-bottom:12px">${t('invite_link_hint')} <strong>${esc(email)}</strong>:</p>
          <input value="${esc(link)}" readonly onclick="this.select()" />
          <p style="font-size:12px;color:var(--ink2);margin-top:10px">${t('invite_valid')}</p>
          <div class="modal-actions">
            <button class="btn-primary" onclick="navigator.clipboard.writeText('${esc(link)}');toast('${t('invite_copied')}')">📋 ${t('invite_copy')}</button>
          </div>
        </div>`);
    } catch (e) { toast(apiError(e.message), 'error'); }
  });
}

/* ---------------- Projecten ---------------- */
async function renderProjects(main) {
  const { projects } = await api('/projects');
  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('project', 22)} ${t('projects')} <span class="sub">${projects.length}</span></div>
      <div class="page-actions"><button class="btn-primary" id="btn-proj-all">${icon('plus', 16)} ${t('new_project')}</button></div>
    </div>
    <div class="project-grid">
      ${projects.map((p) => `
        <div class="project-card" data-nav="#/project/${p.id}" style="--pcolor:${esc(p.color || '#4f46e5')}">
          <div class="project-icon" style="background:color-mix(in srgb, ${esc(p.color || '#4f46e5')} 18%, transparent)">${esc(p.icon || '📋')}</div>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description || '')}</p>
          <div class="meta">
            <span>${icon('org', 13)} ${esc(p.org_name)}</span>
            <span>${icon('clipboard', 13)} ${p.task_count} ${t('task').toLowerCase()}s</span>
          </div>
        </div>`).join('') || `<div class="empty-state"><div class="big">📂</div>${t('no_projects')}<br><br><button class="btn-primary" id="btn-proj-all2">${t('new_project')}</button></div>`}
    </div>`;
  $('#btn-proj-all')?.addEventListener('click', () => showProjectModal());
  $('#btn-proj-all2')?.addEventListener('click', () => showProjectModal());
}

function showProjectModal(orgId) {
  const orgs = state.overview?.orgs || [];
  const hasOrgs = orgs.length > 0;
  openModal(`
    <div class="modal-header"><h2>${t('new_project_title')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
${hasOrgs ? `
       <label>${t('project_org')} *</label>
       <select id="proj-org">
         ${orgs.map((o) => `<option value="${o.id}" ${o.id === orgId ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}
       </select>
       <label>${t('project_name')} *</label>
       <input id="proj-name" placeholder="Bijv. Website relaunch" autocomplete="off" />
       <label>${t('first_board_name')}</label>
       <input id="proj-board-name" placeholder="Bijv. Sprint 1, Kanban, Backlog..." autocomplete="off" />
       <label>${t('project_desc')}</label>
      <textarea id="proj-desc" rows="3"></textarea>
      <label>${t('project_color')}</label>
      <input id="proj-color" type="color" value="#4f46e5" style="width:80px;height:36px;padding:2px" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="proj-create">${t('create')}</button>
      </div>`
      : `
      <div class="empty-state">
        <div class="big">🏢</div>
        <p>${t('no_orgs')}.<br>${t('create_org')}.</p>
        <br>
        <button class="btn-primary" id="proj-org-create">＋ ${t('org')}</button>
        <button class="btn-ghost" onclick="closeModal()">${t('close')}</button>
      </div>`}
    </div>`);
  $('#proj-org-create')?.addEventListener('click', () => { closeModal(); showOrgModal(); });
  $('#proj-create')?.addEventListener('click', async () => {
    try {
      const orgIdSel = Number($('#proj-org').value);
      const name = $('#proj-name').value;
      if (!orgIdSel || !name) return toast(t('required'), 'error');
      const { project } = await api(`/projects?orgId=${orgIdSel}`, {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          description: $('#proj-desc').value, 
          color: $('#proj-color').value,
          board_name: $('#proj-board-name').value
        })
      });
      toast(`${t('project')} "${project.name}" ${t('org_created')}`);
      closeModal();
      invalidateOverview();
      location.hash = `#/project/${project.id}`;
    } catch (e) { toast(apiError(e.message), 'error'); }
  });
}

/* ---------------- Project detail ---------------- */
async function renderProject(main, { id }) {
  const projectId = Number(id);
  const data = await api(`/projects/${projectId}`);
  const { project, boards, members } = data;
  const isAdmin = data.myRole === 'admin' || data.myRole === 'owner' || data.myRole === 'member';
  const activity = await api(`/activity?orgId=${project.org_id}`).catch(() => ({ activity: [] }));
  const projActivity = (activity.activity || []).filter((a) => a.entity_name || a.action.startsWith('task'));
  const metrics = await api(`/projects/${projectId}/metrics`).catch(() => null);
  const m = metrics && Array.isArray(metrics.series) ? metrics : null;
  const pct = m && m.totals && m.totals.tasks ? Math.round((m.totals.done / m.totals.tasks) * 100) : 0;
  const maxSeries = m ? Math.max(1, ...m.series.map((s) => s.created + s.done)) : 1;
  const maxAssign = m && m.byAssignee && m.byAssignee.length ? Math.max(1, ...m.byAssignee.map((a) => a.n)) : 1;
  const metricsHTML = m ? `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">${icon('activity', 16)} ${t('metrics')}</span></div>
      <div class="card-body">
        <div class="metric-stats" style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
          <span style="font-size:14px"><strong>${m.totals ? m.totals.tasks : 0}</strong> ${t('metric_tasks')}</span>
          <span style="font-size:14px"><strong>${m.totals ? m.totals.open : 0}</strong> ${t('metric_open')}</span>
          <span style="font-size:14px"><strong>${m.totals ? m.totals.done : 0}</strong> ${t('metric_done')}</span>
          <div class="progress" style="flex:1;min-width:140px"><div class="progress-bar" style="width:${pct}%"></div></div>
          <span style="font-size:13px;color:var(--ink2)">${pct}%</span>
        </div>
        <div class="metric-chart" style="display:flex;align-items:flex-end;gap:3px;height:80px;margin-bottom:6px">
          ${m.series.map((s) => `
            <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:1px;height:100%">
              <div title="${s.date} ${t('metric_done')} ${s.done}" style="background:#4ade80;height:${Math.round((s.done / maxSeries) * 100)}%"></div>
              <div title="${s.date} ${t('metric_tasks').toLowerCase()} ${s.created}" style="background:var(--brand);height:${Math.round((s.created / maxSeries) * 100)}%"></div>
            </div>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--ink3);margin-bottom:16px">${t('metric_created_done')}</div>
        <div class="grid-2">
          <div>
            <strong style="font-size:13px">${t('metric_by_assignee')}</strong>
            ${(m.byAssignee || []).slice(0, 6).map((a) => `
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                ${avatarHTML(a, 22)}
                <span style="flex:1;font-size:13px">${esc(a.full_name || a.username)}</span>
                <div class="progress" style="flex:2;min-width:80px"><div class="progress-bar" style="width:${Math.round((a.n / maxAssign) * 100)}%"></div></div>
                <span style="font-size:12px;color:var(--ink2)">${a.n}</span>
              </div>`).join('') || `<div style="color:var(--ink3);font-size:13px;margin-top:8px">${t('noData')}</div>`}
          </div>
          <div>
            <strong style="font-size:13px">${t('metric_by_column')}</strong>
            ${(m.byColumn || []).map((c) => `
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                <span class="col-dot" style="background:${esc(c.color)}"></span>
                <span style="flex:1;font-size:13px">${esc(c.name)}</span>
                <span style="font-size:12px;color:var(--ink2)">${c.n}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>` : '';

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('project', 22)} ${esc(project.name)} <span class="sub">${icon('org', 13)} ${esc(project.org_name)}</span></div>
      <div class="page-actions">
        <button class="btn-ghost" data-export="${projectId}">${icon('download', 16)} ${t('export_csv')}</button>
        ${isAdmin ? `<button class="btn-primary" id="btn-board-new">${icon('plus', 16)} ${t('new_board')}</button>
        <button class="btn-ghost" id="btn-proj-edit">${icon('edit', 16)} ${t('edit')}</button>
        <button class="btn-danger" id="btn-proj-del">${icon('trash', 16)} ${t('delete')}</button>` : ''}
      </div>
    </div>
    ${project.description ? `<p style="color:var(--ink2);margin-bottom:20px">${esc(project.description)}</p>` : ''}
    ${metricsHTML}

    <div class="board-tabs" id="project-boards">
      ${boards.map((b) => `
        <button class="board-tab" data-nav="#/board/${b.id}">${icon('layers', 14)} ${esc(b.name)}</button>`).join('')}
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${icon('user', 16)} ${t('project_members')}</span>
          ${isAdmin ? `<button class="btn-ghost btn-sm" id="btn-member-add">${icon('plus', 14)} ${t('member_add')}</button>` : ''}
        </div>
        <div class="member-list">
          ${members.map((m) => `
            <div class="member-row">
              ${avatarHTML(m, 30)}
              <div class="m-info">
                <div class="m-name">${esc(m.fullName || m.username)}</div>
                <div class="m-email">${esc(m.email)}</div>
              </div>
              ${isAdmin ? `
                <select class="role-select" data-projrole="${m.id}">
                  ${['admin', 'member', 'viewer'].map((r) => `<option value="${r}" ${(m.project_role || 'member') === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
                <button class="btn-ghost btn-sm" data-projremove="${m.id}">${icon('trash', 13)}</button>`
                : `<span class="role-pill" style="position:static">${esc(m.project_role || 'member')}</span>`}
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('activity', 16)} ${t('activity')}</span></div>
        <div class="activity-list" style="max-height:400px;overflow-y:auto">
          ${projActivity.slice(0, 30).map((a) => `
            <div class="activity-item">
              ${avatarHTML({ fullName: a.full_name, username: a.username, avatarColor: a.avatar_color, avatarUrl: a.avatar_url }, 26)}
              <div class="a-text"><strong>${esc(a.full_name || a.username)}</strong> ${activityText(a)}</div>
              <div class="a-time">${timeAgo(a.created_at)}</div>
            </div>`).join('') || `<div class="empty-state">${t('no_activity')}</div>`}
        </div>
      </div>
    </div>`;

  $('[data-export]')?.addEventListener('click', () => {
    const exportId = $('[data-export]').dataset.export;
    window.open(`${API}/projects/${exportId}/export`, '_blank');
  });
  $('#btn-board-new')?.addEventListener('click', () => showBoardModal(projectId));
  $('#btn-proj-edit')?.addEventListener('click', () => showEditProjectModal(project, projectId));
  $('#btn-proj-del')?.addEventListener('click', async () => {
    if (!confirm(t('project_delete_confirm'))) return;
    await api(`/projects/${projectId}`, { method: 'DELETE' });
    toast(t('project_deleted'));
    invalidateOverview();
    location.hash = `#/org/${project.org_id}`;
  });
  $('#btn-member-add')?.addEventListener('click', () => showMemberModal(projectId, members));
  $$('[data-projrole]').forEach((sel) => sel.addEventListener('change', async () => {
    try {
      await api(`/projects/${projectId}/members/${sel.dataset.projrole}`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) });
      toast(t('role_updated'));
    } catch (e) { toast(apiError(e.message), 'error'); }
  }));
  $$('[data-projremove]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(t('member_remove_confirm'))) return;
    await api(`/projects/${projectId}/members/${b.dataset.projremove}`, { method: 'DELETE' });
    toast(t('member_removed'));
    router();
  }));
}

function showMemberModal(projectId, members) {
  openModal(`
    <div class="modal-header"><h2>${t('member_add')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--ink2);margin-bottom:4px">${t('member_add_hint')}</p>
      <label>${t('member')}</label>
      <select id="pm-user">
        ${members.filter((m) => !m.project_role).map((m) => `<option value="${m.id}">${esc(m.fullName || m.username)}</option>`).join('') || `<option value="">${t('no_members_available')}</option>`}
      </select>
      <label>${t('role')}</label>
      <select id="pm-role">
        <option value="member">member</option>
        <option value="admin">admin</option>
        <option value="viewer">viewer</option>
      </select>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="pm-save">${t('add')}</button>
      </div>
    </div>`);
  $('#pm-save').addEventListener('click', async () => {
    try {
      const userId = Number($('#pm-user').value);
      if (!userId) return toast(t('no_members_available'), 'error');
      await api(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify({ userId, role: $('#pm-role').value }) });
      toast(t('member_added'));
      closeModal();
      router();
    } catch (e) { toast(apiError(e.message), 'error'); }
  });
}

function showBoardModal(projectId) {
  openModal(`
    <div class="modal-header"><h2>${t('board_new_title')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>${t('board_name')}</label>
      <input id="board-name" placeholder="Bijv. Sprint 5" autocomplete="off" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="board-create">${t('create')}</button>
      </div>
    </div>`);
  $('#board-create').addEventListener('click', async () => {
    try {
      const { board } = await api(`/projects/${projectId}/boards`, { method: 'POST', body: JSON.stringify({ name: $('#board-name').value }) });
      toast(`${t('board')} ${t('org_created')}`);
      closeModal();
      location.hash = `#/board/${board.id}`;
    } catch (e) { toast(apiError(e.message), 'error'); }
  });
}

function showEditProjectModal(project, projectId) {
  const isArchived = project.status === 'archived';
  openModal(`
    <div class="modal-header"><h2>${t('project_edit')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>${t('project_name')}</label>
      <input id="ep-name" value="${esc(project.name)}" autocomplete="off" />
      <label>${t('project_desc')}</label>
      <textarea id="ep-desc" rows="3">${esc(project.description || '')}</textarea>
      <label>${t('project_color')}</label>
      <input id="ep-color" type="color" value="${esc(project.color)}" style="width:80px;height:36px;padding:2px" />
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px">
        <input id="ep-archived" type="checkbox" ${isArchived ? 'checked' : ''} />
        <span>${t('project_archive')}</span>
      </label>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="ep-save">${t('save')}</button>
      </div>
    </div>`);
  $('#ep-save').addEventListener('click', async () => {
    await api(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify({ 
      name: $('#ep-name').value, 
      description: $('#ep-desc').value, 
      color: $('#ep-color').value,
      status: $('#ep-archived').checked ? 'archived' : 'active'
    }) });
    toast(t('saved'));
    closeModal();
    router();
  });
}

/* ---------------- Task Templates ---------------- */
const DEFAULT_TEMPLATES = [
  {
    id: 'bug',
    name: 'Bug Report',
    icon: '🐛',
    description: 'Standaard bug rapportage',
    title: '[Bug] ',
    description_template: '## Beschrijving\n\n## Stappen om te reproduceren\n1. \n2. \n3. \n\n## Verwacht gedrag\n\n## Actueel gedrag\n\n## Omgeving\n- OS: \n- Browser: \n- Versie: ',
    priority: 'high',
    tags: ['bug'],
    checklists: [
      { title: 'Reproduceren', items: ['Stappen bevestigd', 'Root cause gevonden'] },
      { title: 'Fix', items: ['Fix geïmplementeerd', 'Tests toegevoegd'] },
      { title: 'Review', items: ['Code review', 'QA getest'] }
    ]
  },
  {
    id: 'feature',
    name: 'Feature Request',
    icon: '💡',
    description: 'Nieuwe functionaliteit voorstellen',
    title: '[Feature] ',
    description_template: '## Probleem / Kans\n\n## Voorgestelde oplossing\n\n## Acceptatiecriteria\n- [ ] \n- [ ] \n- [ ] \n\n## Technische overwegingen\n\n## Prioriteit / Impact',
    priority: 'medium',
    tags: ['feature'],
    checklists: [
      { title: 'Ontwerp', items: ['Wireframes', 'Technisch ontwerp'] },
      { title: 'Implementatie', items: ['Backend', 'Frontend', 'Tests'] },
      { title: 'Release', items: ['Documentatie', 'Changelog', 'Deploy'] }
    ]
  },
  {
    id: 'task',
    name: 'Standaard Taak',
    icon: '📋',
    description: 'Algemene taak met basis structuur',
    title: '',
    description_template: '## Doel\n\n## Taken\n- [ ] \n- [ ] \n- [ ] \n\n## Notities\n',
    priority: 'medium',
    tags: [],
    checklists: [
      { title: 'Uitvoering', items: ['Stap 1', 'Stap 2', 'Stap 3'] }
    ]
  },
  {
    id: 'meeting',
    name: 'Meeting Notities',
    icon: '📝',
    description: 'Actiepunten uit een vergadering',
    title: '[Meeting] ',
    description_template: '## Datum & Tijd\n\n## Deelnemers\n\n## Agenda\n\n## Besluiten\n\n## Actiepunten\n- [ ] \n- [ ] \n- [ ] ',
    priority: 'low',
    tags: ['meeting'],
    checklists: []
  },
  {
    id: 'release',
    name: 'Release Checklist',
    icon: '🚀',
    description: 'Checklist voor een nieuwe release',
    title: '[Release] ',
    description_template: '## Versie\n\n## Wat is nieuw\n\n## Breaking changes\n\n## Migratie stappen\n\n## Rollback plan',
    priority: 'high',
    tags: ['release', 'deploy'],
    checklists: [
      { title: 'Pre-release', items: ['Tests draaien', 'Changelog bijgewerkt', 'Versie bumped'] },
      { title: 'Deploy', items: ['Staging deploy', 'Smoke tests', 'Productie deploy'] },
      { title: 'Post-release', items: ['Monitoring check', 'Team geïnformeerd', 'Documentatie bijgewerkt'] }
    ]
  }
];

function getTemplates() {
  const norm = (t) => ({ ...t, checklists: t.checklists || t.checklist || [] });
  try {
    const custom = JSON.parse(localStorage.getItem('mb_task_templates') || '[]');
    return [...DEFAULT_TEMPLATES, ...custom].map(norm);
  } catch (e) {
    return DEFAULT_TEMPLATES.map(norm);
  }
}

function saveCustomTemplate(template) {
  try {
    const custom = JSON.parse(localStorage.getItem('mb_task_templates') || '[]');
    custom.push({ ...template, id: 'custom_' + Date.now(), custom: true });
    localStorage.setItem('mb_task_templates', JSON.stringify(custom));
    return true;
  } catch (e) {
    return false;
  }
}

function showManageTemplatesModal() {
  const templates = getTemplates().filter(t => t.custom);
  openModal(`
    <div class="modal-header"><h2>${t('manage_templates')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      ${templates.length ? templates.map((t) => `
        <div class="card" style="margin-bottom:12px;padding:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong>${esc(t.icon)} ${esc(t.name)}</strong>
            <div style="font-size:12px;color:var(--ink2)">${esc(t.description)}</div>
          </div>
          <button class="btn-ghost btn-sm" data-del-template="${t.id}">${icon('trash', 14)} ${t('delete')}</button>
        </div>
      `).join('') : `<p style="color:var(--ink2);text-align:center;padding:24px">${t('no_custom_templates')}</p>`}
      <hr style="margin:16px 0;border-color:var(--border)">
      <button class="btn-primary" id="btn-new-template">${icon('plus', 16)} ${t('new_template')}</button>
    </div>`);

  $$('[data-del-template]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('template_delete_confirm'))) return;
      try {
        const custom = JSON.parse(localStorage.getItem('mb_task_templates') || '[]');
        const filtered = custom.filter((t) => t.id !== btn.dataset.delTemplate);
        localStorage.setItem('mb_task_templates', JSON.stringify(filtered));
        toast(t('template_deleted'));
        showManageTemplatesModal();
      } catch (e) { toast(t('template_delete_err'), 'error'); }
    });
  });

  $('#btn-new-template').addEventListener('click', () => {
    closeModal();
    showCreateTemplateModal();
  });
}

function showCreateTemplateModal() {
  openModal(`
    <div class="modal-header"><h2>${t('new_template_title')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>${t('template_name')} *</label>
      <input id="tpl-name" placeholder="Bijv. Code Review" autocomplete="off" />
      <label>${t('template_icon')}</label>
      <input id="tpl-icon" placeholder="📋" maxlength="2" style="font-size:24px" />
      <label>${t('template_desc')}</label>
      <input id="tpl-desc" placeholder="Korte beschrijving" autocomplete="off" />
      <label>${t('template_title_prefix')}</label>
      <input id="tpl-title" placeholder="[Review] " autocomplete="off" />
      <label>${t('template_desc_template')}</label>
      <textarea id="tpl-desc-template" rows="6" placeholder="## Beschrijving&#10;&#10;## Taken&#10;- [ ] "></textarea>
      <label>${t('template_priority')}</label>
      <select id="tpl-prio">
        <option value="low">${t('low')}</option>
        <option value="medium" selected>${t('medium')}</option>
        <option value="high">${t('high')}</option>
        <option value="urgent">${t('urgent')}</option>
      </select>
      <label>${t('template_tags')}</label>
      <input id="tpl-tags" placeholder="review, code" autocomplete="off" />
      <label>${t('template_checklists')}</label>
      <textarea id="tpl-checklists" rows="4" placeholder='[{"title": "Stappen", "items": ["Stap 1", "Stap 2"]}]'></textarea>
      <p style="font-size:11px;color:var(--ink2)">${t('template_checklists_hint')}</p>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="tpl-save">${t('create')}</button>
      </div>
    </div>`);

  $('#tpl-save').addEventListener('click', () => {
    const name = $('#tpl-name').value.trim();
    if (!name) return toast(t('template_name_required'), 'error');
    let checklists = [];
    try {
      checklists = JSON.parse($('#tpl-checklists').value || '[]');
      if (!Array.isArray(checklists)) throw new Error();
    } catch (e) {
      checklists = [];
    }
    const template = {
      name,
      icon: $('#tpl-icon').value || '📋',
      description: $('#tpl-desc').value.trim(),
      title: $('#tpl-title').value,
      description_template: $('#tpl-desc-template').value,
      priority: $('#tpl-prio').value,
      tags: $('#tpl-tags').value.split(',').map(s => s.trim()).filter(Boolean),
      checklists
    };
    if (saveCustomTemplate(template)) {
      toast(t('template_created'));
      closeModal();
      showManageTemplatesModal();
    } else {
      toast(t('template_save_fail'), 'error');
    }
  });
}

/* ---------------- Kanban board ---------------- */
async function renderBoard(main, { id }) {
  const boardId = Number(id);
  const data = await api(`/boards/${boardId}`);
  const { board, columns, tasks, members, myRole } = data;
  const canEdit = ['owner', 'admin', 'member'].includes(myRole) || state.user.role === 'admin';
  const canManage = myRole === 'admin' || myRole === 'owner' || state.user.role === 'admin';
  state.current.board = data;

  const tasksByCol = {};
  columns.forEach((c) => { tasksByCol[c.id] = tasks.filter((t) => t.column_id === c.id); });

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('layers', 22)} ${esc(board.name)} <span class="sub">${icon('project', 13)} ${esc(board.project_name)}</span></div>
      <div class="page-actions">
        <div class="view-toggle">
          <button class="view-btn active" data-view="kanban">${t('view_board')}</button>
          <button class="view-btn" data-view="list">${t('view_list')}</button>
        </div>
        ${canEdit ? `<button class="btn-primary" id="btn-task-new">${icon('plus', 16)} ${t('new_task')}</button>` : ''}
        ${canManage ? `<button class="btn-ghost" id="btn-col-new">${icon('plus', 16)} ${t('add_column')}</button>
        <button class="btn-ghost" id="btn-board-del">${icon('trash', 16)} ${t('delete_board')}</button>` : ''}
      </div>
    </div>
    <div class="board-filters">
      <div class="filter-search">${icon('search', 15)}<input id="filter-q" type="search" placeholder="${t('filter_placeholder')}" autocomplete="off" /></div>
      <select id="filter-prio">
        <option value="">${t('filter_prio_all')}</option>
        <option value="urgent">${t('urgent')}</option>
        <option value="high">${t('high')}</option>
        <option value="medium">${t('medium')}</option>
        <option value="low">${t('low')}</option>
      </select>
      <select id="filter-assignee">
        <option value="">${t('filter_assignee_all')}</option>
        ${members.map((m) => `<option value="${m.id}">${esc(m.fullName || m.username)}</option>`).join('')}
      </select>
      <div class="filter-saved" id="filter-saved">
        <button type="button" class="btn-ghost btn-sm" id="btn-save-filter" title="${t('save_filter')}">${icon('download', 14)} ${t('save_filter')}</button>
        <select id="saved-filters-select" style="min-width:160px">
          <option value="">${t('saved_filters')}</option>
        </select>
      </div>
    </div>
    <div class="kanban" id="kanban">${columns.map((c) => `
      <div class="kanban-column" data-col="${c.id}" data-position="${c.position}" style="--col:${esc(c.color)}">
        <div class="kanban-column-header">
          <span class="col-dot" style="background:${esc(c.color)}"></span>
          ${esc(c.name)}
          <span class="count" data-count="${c.id}">${tasksByCol[c.id].length}</span>
          ${c.wip_limit ? `<span class="wip ${tasksByCol[c.id].length > c.wip_limit ? 'over' : ''}">WIP ${tasksByCol[c.id].length}/${c.wip_limit}</span>` : ''}
          ${canManage ? `<span class="col-actions">
            <button class="col-action" data-coledit="${c.id}" title="${t('edit')}">${icon('edit', 14)}</button>
            <button class="col-action" data-coldel="${c.id}" title="${t('delete')}">${icon('trash', 14)}</button>
          </span>` : ''}
        </div>
        <div class="kanban-column-body" data-drop="${c.id}">
          ${tasksByCol[c.id].map((t) => taskCardHTML(t)).join('')}
        </div>
      </div>`).join('')}</div>
    <div id="board-view-list" class="hidden"></div>`;

  // events
  $('#btn-task-new')?.addEventListener('click', () => showTaskModal(board, columns, members, null));
  $('#btn-col-new')?.addEventListener('click', () => showColumnModal(boardId));
  $('#btn-board-del')?.addEventListener('click', async () => {
    if (!confirm(t('board_delete_confirm'))) return;
    await api(`/boards/${boardId}`, { method: 'DELETE' });
    toast(t('board_deleted'));
    location.hash = `#/project/${board.project_id}`;
  });
  $$('[data-coledit]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const col = columns.find((c) => c.id === Number(b.dataset.coledit));
    showColumnModal(boardId, col);
  }));
  $$('[data-coldel]').forEach((b) => b.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm(t('column_delete_confirm'))) return;
    await api(`/columns/${b.dataset.coldel}`, { method: 'DELETE' });
    toast(t('column_deleted'));
    renderBoard(main, { id });
  }));

  // task click + drag & drop (mouse + touch)
  let dragTaskId = null;
  let dragGhost = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let isTouchDrag = false;

  $$('.kanban-card').forEach((card) => {
    // Mouse drag
    card.setAttribute('draggable', canEdit ? 'true' : 'false');
    card.addEventListener('dragstart', (e) => {
      if (e.dataTransfer) e.dataTransfer.setData('text/plain', card.dataset.id);
      card.classList.add('dragging');
      dragTaskId = card.dataset.id;
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragTaskId = null;
    });

    // Touch drag
    if (canEdit) {
      card.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        isTouchDrag = false;
        dragTaskId = card.dataset.id;

        // Long press to initiate drag
        card.dataset.dragTimeout = setTimeout(() => {
          isTouchDrag = true;
          card.classList.add('dragging');
          card.dataset.dragged = 'true';

          // Create ghost element
          dragGhost = card.cloneNode(true);
          dragGhost.style.position = 'fixed';
          dragGhost.style.pointerEvents = 'none';
          dragGhost.style.zIndex = '9999';
          dragGhost.style.opacity = '0.9';
          dragGhost.style.transform = 'rotate(3deg)';
          dragGhost.style.width = card.offsetWidth + 'px';
          document.body.appendChild(dragGhost);
          updateGhostPosition(touch.clientX, touch.clientY);
        }, 300);
      }, { passive: true });

      card.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - dragStartX);
        const deltaY = Math.abs(touch.clientY - dragStartY);

        if (dragTaskId && (deltaX > 10 || deltaY > 10)) {
          clearTimeout(card.dataset.dragTimeout);
          if (!isTouchDrag) {
            isTouchDrag = true;
            card.classList.add('dragging');
            card.dataset.dragged = 'true';

            dragGhost = card.cloneNode(true);
            dragGhost.style.position = 'fixed';
            dragGhost.style.pointerEvents = 'none';
            dragGhost.style.zIndex = '9999';
            dragGhost.style.opacity = '0.9';
            dragGhost.style.transform = 'rotate(3deg)';
            dragGhost.style.width = card.offsetWidth + 'px';
            document.body.appendChild(dragGhost);
          }
          updateGhostPosition(touch.clientX, touch.clientY);
          e.preventDefault();

          // Check drop target
          const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
          const dropZone = dropTarget?.closest('[data-drop]');
          $$('[data-drop]').forEach((dz) => dz.closest('.kanban-column').classList.remove('dragover'));
          if (dropZone) dropZone.closest('.kanban-column').classList.add('dragover');
        }
      }, { passive: false });

      card.addEventListener('touchend', (e) => {
        clearTimeout(card.dataset.dragTimeout);
        if (isTouchDrag && dragTaskId) {
          const touch = e.changedTouches[0];
          const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
          const dropZone = dropTarget?.closest('[data-drop]');
          if (dropZone) {
            const columnId = Number(dropZone.dataset.drop);
            moveTask(dragTaskId, columnId);
          }
        }
        cleanupDrag(card);
      });

      card.addEventListener('touchcancel', () => {
        clearTimeout(card.dataset.dragTimeout);
        cleanupDrag(card);
      });
    }
  });

  function updateGhostPosition(x, y) {
    if (dragGhost) {
      dragGhost.style.left = (x - dragGhost.offsetWidth / 2) + 'px';
      dragGhost.style.top = (y - 40) + 'px';
    }
  }

  function cleanupDrag(card) {
    card.classList.remove('dragging');
    delete card.dataset.dragged;
    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }
    $$('[data-drop]').forEach((dz) => dz.closest('.kanban-column').classList.remove('dragover'));
    dragTaskId = null;
    isTouchDrag = false;
  }

  $$('.kanban-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (card.dataset.dragged) return;
      location.hash = `#/task/${card.dataset.id}`;
    });
  });

  if (canEdit) {
    $$('[data-drop]').forEach((drop) => {
      drop.addEventListener('dragover', (e) => {
        e.preventDefault();
        drop.closest('.kanban-column').classList.add('dragover');
      });
      drop.addEventListener('dragleave', () => drop.closest('.kanban-column').classList.remove('dragover'));
      drop.addEventListener('drop', async (e) => {
        e.preventDefault();
        drop.closest('.kanban-column').classList.remove('dragover');
        const taskId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
        if (!taskId) return;
        const columnId = Number(drop.dataset.drop);
        await moveTask(taskId, columnId);
      });
    });
  }

  // bordfilters
  const applyFilters = () => {
    const q = ($('#filter-q').value || '').toLowerCase();
    const prio = $('#filter-prio').value;
    const assignee = $('#filter-assignee').value;
    $$('.kanban-card').forEach((card) => {
      const t = tasks.find((x) => x.id === Number(card.dataset.id));
      let show = true;
      if (prio && t.priority !== prio) show = false;
      if (assignee && (t.assignee_id || '') !== assignee) show = false;
      if (q) {
        const hay = `${t.title} ${t.description || ''} ${(t.tags || []).map((x) => x.name).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) show = false;
      }
      card.style.display = show ? '' : 'none';
    });
    if ($('#board-view-list') && !$('#board-view-list').classList.contains('hidden')) {
      $$('.list-row').forEach((row) => {
        const t = tasks.find((x) => x.id === Number(row.dataset.task));
        let show = true;
        if (prio && t.priority !== prio) show = false;
        if (assignee && (t.assignee_id || '') !== assignee) show = false;
        if (q) {
          const hay = `${t.title} ${t.description || ''} ${(t.tags || []).map((x) => x.name).join(' ')}`.toLowerCase();
          if (!hay.includes(q)) show = false;
        }
        row.style.display = show ? '' : 'none';
      });
    }
  };

  const loadSavedFilters = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(`mb_filters_${boardId}`) || '[]');
      const select = $('#saved-filters-select');
      select.innerHTML = `<option value="">${t('saved_filters')}</option>` + saved.map((f, i) => `<option value="${i}">${esc(f.name)}</option>`).join('');
    } catch (e) {}
  };

  const saveCurrentFilter = () => {
    const name = prompt(t('filter_name_prompt'));
    if (!name) return;
    const filter = {
      name,
      q: $('#filter-q').value,
      prio: $('#filter-prio').value,
      assignee: $('#filter-assignee').value
    };
    try {
      const saved = JSON.parse(localStorage.getItem(`mb_filters_${boardId}`) || '[]');
      saved.push(filter);
      localStorage.setItem(`mb_filters_${boardId}`, JSON.stringify(saved));
      loadSavedFilters();
      toast(t('filter_saved'));
    } catch (e) { toast(t('filter_save_fail'), 'error'); }
  };

  const applySavedFilter = (index) => {
    try {
      const saved = JSON.parse(localStorage.getItem(`mb_filters_${boardId}`) || '[]');
      const f = saved[index];
      if (!f) return;
      $('#filter-q').value = f.q || '';
      $('#filter-prio').value = f.prio || '';
      $('#filter-assignee').value = f.assignee || '';
      applyFilters();
      toast(`"${f.name}" ${t('filter_applied')}`);
    } catch (e) {}
  };

  $('#filter-q')?.addEventListener('input', applyFilters);
  $('#filter-prio')?.addEventListener('change', applyFilters);
  $('#filter-assignee')?.addEventListener('change', applyFilters);
  $('#btn-save-filter')?.addEventListener('click', saveCurrentFilter);
  $('#saved-filters-select')?.addEventListener('change', (e) => {
    if (e.target.value) applySavedFilter(Number(e.target.value));
    e.target.value = '';
  });
  loadSavedFilters();

  // Column drag-and-drop reordering
  if (canManage) {
    const kanban = $('#kanban');
    let dragCol = null;
    let dragColGhost = null;

    $$('.kanban-column').forEach((colEl) => {
      colEl.setAttribute('draggable', 'true');
      colEl.style.cursor = 'grab';

      colEl.addEventListener('dragstart', (e) => {
        dragCol = colEl;
        colEl.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', colEl.dataset.col);
        }
        dragColGhost = colEl.cloneNode(true);
        dragColGhost.style.position = 'fixed';
        dragColGhost.style.pointerEvents = 'none';
        dragColGhost.style.zIndex = '9999';
        dragColGhost.style.opacity = '0.5';
        dragColGhost.style.width = colEl.offsetWidth + 'px';
        document.body.appendChild(dragColGhost);
      });

      colEl.addEventListener('drag', (e) => {
        if (dragColGhost) {
          dragColGhost.style.left = (e.clientX - dragColGhost.offsetWidth / 2) + 'px';
          dragColGhost.style.top = (e.clientY - 40) + 'px';
        }
      });

      colEl.addEventListener('dragend', () => {
        colEl.classList.remove('dragging');
        if (dragColGhost) { dragColGhost.remove(); dragColGhost = null; }
        $$('.kanban-column').forEach(c => c.classList.remove('drag-over'));
        dragCol = null;
      });

      colEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragCol && dragCol !== colEl) {
          colEl.classList.add('drag-over');
        }
      });

      colEl.addEventListener('dragleave', () => {
        colEl.classList.remove('drag-over');
      });

      colEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        colEl.classList.remove('drag-over');
        if (!dragCol || dragCol === colEl) return;

        const fromIndex = Number(dragCol.dataset.position);
        const toIndex = Number(colEl.dataset.position);
        const columns = Array.from(kanban.querySelectorAll('.kanban-column')).sort((a, b) => Number(a.dataset.position) - Number(b.dataset.position));
        const movedCol = columns.splice(fromIndex, 1)[0];
        columns.splice(toIndex, 0, movedCol);

        try {
          await api(`/boards/${boardId}/columns/reorder`, {
            method: 'POST',
            body: JSON.stringify({ columnIds: columns.map(c => Number(c.dataset.col)) })
          });
          toast(t('columns_reordered'));
          router();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  }

  // view toggle: kanban / lijst
  let listRendered = false;
  $$('.view-btn').forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.view;
    $$('.view-btn').forEach((x) => x.classList.toggle('active', x === b));
    $('#kanban').classList.toggle('hidden', v !== 'kanban');
    $('#board-view-list').classList.toggle('hidden', v !== 'list');
    if (v === 'list' && !listRendered) {
      listRendered = true;
      renderBoardListView({ board, columns, tasks, members, myRole });
    }
    applyFilters();
  }));
}

function renderBoardListView({ board, columns, tasks, members, myRole }) {
  const container = $('#board-view-list');
  const cols = [
    { key: 'title', label: t('task_title') },
    { key: 'column_name', label: t('column') },
    { key: 'priority', label: t('task_priority') },
    { key: 'assignee', label: t('task_assignee') },
    { key: 'due_date', label: t('task_due') },
    { key: 'tags', label: t('task_tags') }
  ];
  let sortKey = 'position';
  let sortDir = 1;

  const render = () => {
    const sorted = [...tasks].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === 'assignee') { va = a.assignee_name || a.assignee_username || ''; vb = b.assignee_name || b.assignee_username || ''; }
      if (sortKey === 'tags') { va = (a.tags || []).map((x) => x.name).join(','); vb = (b.tags || []).map((x) => x.name).join(','); }
      if (sortKey === 'due_date') { va = va || '9999-12-31'; vb = vb || '9999-12-31'; }
      if (sortKey === 'priority') { va = { urgent: 0, high: 1, medium: 2, low: 3 }[va] ?? 4; vb = { urgent: 0, high: 1, medium: 2, low: 3 }[vb] ?? 4; }
      if (va === vb) return 0;
      return (va < vb ? -1 : 1) * sortDir;
    });
    container.innerHTML = `
      <div class="card">
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table class="admin-table list-table">
            <thead><tr>
              ${cols.map((c) => `<th class="sortable" data-sort="${c.key}">${c.label} ${sortKey === c.key ? (sortDir === 1 ? '↑' : '↓') : ''}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${sorted.map((t) => `
                <tr class="list-row" data-task="${t.id}" data-nav="#/task/${t.id}">
                  <td><span style="font-weight:600">${esc(t.title)}</span> ${t.recurrence_rule && t.recurrence_rule !== 'none' ? '🔁' : ''}</td>
                  <td><span class="column-badge" style="--col:${esc(t.column_color || '#e2e8f0')}">${esc(t.column_name)}</span></td>
                  <td>${priorityChip(t.priority)}</td>
                  <td>${t.assignee_id ? avatarHTML({ fullName: t.assignee_name, username: t.assignee_username, avatarColor: t.assignee_color, avatarUrl: t.assignee_avatar_url }, 22) + ' ' + esc(t.assignee_name || t.assignee_username) : '—'}</td>
                  <td style="white-space:nowrap">${t.due_date ? fmtDate(t.due_date) : '—'}</td>
                  <td>${(t.tags || []).map((tg) => `<span class="tag-chip">${esc(tg.name)}</span>`).join('') || '—'}</td>
                </tr>`).join('') || `<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--ink3)">${t('noData')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    $$('.sortable', container).forEach((th) => th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = 1; }
      render();
    }));
    $$('.list-row', container).forEach((r) => r.addEventListener('click', () => {
      location.hash = r.dataset.nav;
    }));
  };
  render();
}

function taskCardHTML(task) {
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  return `
    <div class="kanban-card" data-id="${task.id}" draggable="true" style="border-left-color:${esc(task.column_color || 'transparent')}">
      <div class="k-title">${esc(task.title)}</div>
      ${task.description ? `<div class="k-desc">${esc(task.description)}</div>` : ''}
      <div class="k-meta">
        ${task.recurrence_rule && task.recurrence_rule !== 'none' ? `<span class="k-rec" title="${t('recurring')}: ${t('recurrence_' + task.recurrence_rule)}">🔁</span>` : ''}
        ${priorityChip(task.priority)}
        ${task.tags?.length ? `<span class="k-tags">${task.tags.map((tg) => `<span class="tag-chip">${esc(tg.name)}</span>`).join('')}</span>` : ''}
        ${task.due_date ? `<span class="k-due ${overdue ? 'overdue' : ''}">${icon('clock', 12)} ${fmtDate(task.due_date)}</span>` : ''}
        ${task.assignee_id ? `<span class="k-assignee">${avatarHTML({ fullName: task.assignee_name, username: task.assignee_username, avatarColor: task.assignee_color, avatarUrl: task.assignee_avatar_url }, 24)}</span>` : ''}
      </div>
    </div>`;
}

async function moveTask(taskId, columnId) {
  try {
    await api(`/tasks/${taskId}/move`, { method: 'POST', body: JSON.stringify({ columnId }) });
    toast(t('task_moved'));
    router();
  } catch (e) { toast(e.message, 'error'); }
}

function showColumnModal(boardId, column) {
  const emojis = ['📋', '📝', '🔥', '⚡', '🚀', '🎯', '💡', '🐛', '🔧', '🎨', '📦', '🚧', '⏳', '✅', '📤', '📥', '🗂️', '📁', '🏷️', '🏁', '💬', '👀', '🔍', '🧪', '🚢', '🎉', '❓', '❗', '💤', '🛑', '⏸️', '🔄', '📌', '💾', '🗑️', '⭐', '🎪', '🏗️', '🧱', '📐', '🔬', '🛠️', '📊', '📈', '📉', '🥅', '🏆', '🎁', '📮', '📬', '📭', '🗃️', '🗄️', '📂'];
  const emojiPicker = emojis.map(e => `<button type="button" class="emoji-btn" data-emoji="${e}" style="font-size:20px;padding:6px;border:none;background:var(--bg);border-radius:8px;cursor:pointer;min-width:44px;min-height:44px;">${e}</button>`).join('');

  openModal(`
    <div class="modal-header"><h2>${column ? t('edit_column') : t('new_column')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>${t('column_name')} *</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
        <input id="col-emoji" readonly style="font-size:24px;width:50px;text-align:center;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px;" placeholder="📋" value="${column ? (column.name.match(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u) ? column.name.match(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u)[0] : '📋') : '📋'}" />
        <input id="col-name" value="${column ? esc(column.name.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '')) : ''}" placeholder="Bijv. In review" autocomplete="off" style="flex:1" />
        <button type="button" id="col-emoji-toggle" class="icon-btn" title="Emoji kiezen" style="width:44px;height:44px">${icon('tag', 20)}</button>
      </div>
      <div id="col-emoji-picker" class="hidden" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;max-height:200px;overflow-y:auto;padding:8px;background:var(--bg);border-radius:8px">${emojiPicker}</div>
      <label>${t('column_color')}</label>
      <input id="col-color" type="color" value="${column ? esc(column.color) : '#e2e8f0'}" style="width:80px;height:36px;padding:2px" />
      <label>${t('wip_limit')}</label>
      <input id="col-wip" type="number" min="0" placeholder="Bijv. 5" value="${column?.wip_limit ?? ''}" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn-primary" id="col-save">${t('save')}</button>
      </div>
    </div>`);
  
  // Emoji picker toggle
  $('#col-emoji-toggle').addEventListener('click', () => {
    $('#col-emoji-picker').classList.toggle('hidden');
  });
  
  // Emoji selection
  $$('#col-emoji-picker .emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#col-emoji').value = btn.dataset.emoji;
      $('#col-emoji-picker').classList.add('hidden');
    });
  });
  
  // Close picker when clicking outside
  document.addEventListener('click', function closeEmojiPicker(e) {
    if (!e.target.closest('#col-emoji-toggle') && !e.target.closest('#col-emoji-picker')) {
      $('#col-emoji-picker').classList.add('hidden');
      document.removeEventListener('click', closeEmojiPicker);
    }
  });

  $('#col-save').addEventListener('click', async () => {
    try {
      const emoji = $('#col-emoji').value || '📋';
      const name = `${emoji} ${$('#col-name').value}`.trim();
      if (column) {
        await api(`/columns/${column.id}`, { method: 'PATCH', body: JSON.stringify({ name, color: $('#col-color').value, wipLimit: $('#col-wip').value }) });
      } else {
        await api(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify({ name, color: $('#col-color').value }) });
      }
      toast(t('saved'));
      closeModal();
      router();
    } catch (e) { toast(apiError(e.message), 'error'); }
  });
}

function showTaskModal(board, columns, members, task) {
  const taskId = task?.id;
  const isNew = !task;
  const templates = getTemplates();

openModal(`
    <div class="modal-header"><h2>${isNew ? t('new_task') : t('edit_task')}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      ${isNew ? `
        <label>${t('template_optional')}</label>
        <select id="t-template">
          <option value="">${t('template_none')}</option>
          ${templates.map((t) => `<option value="${t.id}">${esc(t.icon)} ${esc(t.name)}</option>`).join('')}
          <option value="" disabled>──────────────</option>
          <option value="__manage__">⚙ ${t('template_manage')}</option>
        </select>
      ` : ''}
      <label>${t('task_title')} *</label>
      <input id="t-title" value="${task ? esc(task.title) : ''}" maxlength="255" placeholder="Wat moet er gebeuren?" autocomplete="off" />
      <label>${t('task_desc')}</label>
      <textarea id="t-desc" rows="6">${task ? esc(task.description || '') : ''}</textarea>
      <div class="row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label>${t('task_priority')}</label>
          <select id="t-prio">
            ${['low', 'medium', 'high', 'urgent'].map((p) => `<option value="${p}" ${(task?.priority || 'medium') === p ? 'selected' : ''}>${t(p)}</option>`).join('')}
          </select>
        </div>
        <div><label>${t('task_due')}</label><input id="t-due" type="date" value="${task?.due_date || ''}" /></div>
      </div>
      <div class="row row-3" style="display:grid;grid-template-columns:1fr 0.6fr 1fr;gap:12px">
        <div><label>${t('task_recurrence')}</label>
          <select id="t-recurrence">
            <option value="none" ${(task?.recurrence_rule || 'none') === 'none' ? 'selected' : ''}>${t('recurrence_none')}</option>
            <option value="daily" ${task?.recurrence_rule === 'daily' ? 'selected' : ''}>${t('recurrence_daily')}</option>
            <option value="weekly" ${task?.recurrence_rule === 'weekly' ? 'selected' : ''}>${t('recurrence_weekly')}</option>
            <option value="monthly" ${task?.recurrence_rule === 'monthly' ? 'selected' : ''}>${t('recurrence_monthly')}</option>
          </select>
        </div>
        <div><label>${t('recurrence_interval')}</label><input id="t-recurrence-interval" type="number" min="1" value="${task?.recurrence_interval || 1}" /></div>
        <div><label>${t('recurrence_end')}</label><input id="t-recurrence-end" type="date" value="${task?.recurrence_end_date || ''}" /></div>
      </div>
      <div class="row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label>${t('task_column')}</label>
          <select id="t-col">
            ${columns.map((c) => `<option value="${c.id}" ${task?.column_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div>
        <div><label>${t('task_assignee')}</label>
          <select id="t-assignee">
            <option value="">${t('assignee_none')}</option>
            ${members.map((m) => `<option value="${m.id}" ${task?.assignee_id === m.id ? 'selected' : ''}>${esc(m.fullName || m.username)}</option>`).join('')}
          </select>
        </div>
      </div>
      <label>${t('task_tags')}</label>
      <input id="t-tags" value="${task ? (task.tags || []).map((tg) => tg.name).join(', ') : ''}" placeholder="bug, ui, backend" autocomplete="off" />
      <div id="tpl-info" class="hidden" style="margin-top:12px;padding:12px;background:var(--brand-soft);border-radius:var(--radius-sm);border:1px solid var(--brand)">
        <strong style="color:var(--brand)">${icon('check', 14)} <span id="tpl-info-text"></span></strong>
      </div>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        ${!isNew ? `<button class="btn-danger" id="t-delete">${icon('trash', 16)} ${t('delete')}</button>` : ''}
        <button class="btn-primary" id="t-save">${isNew ? `${icon('plus', 16)} ${t('create')}` : `${icon('check', 16)} ${t('save')}`}</button>
      </div>
    </div>`);

  let activeTemplate = null;

  $('#t-template')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === '__manage__') { closeModal(); showManageTemplatesModal(); return; }
    activeTemplate = templates.find((t) => t.id === val) || null;
    $('#t-title').value = activeTemplate?.title || '';
    $('#t-desc').value = activeTemplate?.description_template || '';
    if (activeTemplate) {
      $('#t-prio').value = activeTemplate.priority || 'medium';
      $('#t-tags').value = (activeTemplate.tags || []).join(', ');
    }
    const info = $('#tpl-info');
    const infoText = $('#tpl-info-text');
    if (activeTemplate && activeTemplate.checklists?.length) {
      infoText.textContent = `${t('template_contains')} ${activeTemplate.checklists.length} ${t('checklists').toLowerCase()}(s) — ${t('template_auto')}`;
      info.classList.remove('hidden');
    } else {
      info.classList.add('hidden');
    }
  });

  $('#t-save').addEventListener('click', async () => {
    try {
      const body = {
        title: $('#t-title').value,
        description: $('#t-desc').value,
        priority: $('#t-prio').value,
        dueDate: $('#t-due').value || null,
        assigneeId: $('#t-assignee').value ? Number($('#t-assignee').value) : null,
        tags: $('#t-tags').value.split(',').map((s) => s.trim()).filter(Boolean),
        recurrenceRule: $('#t-recurrence').value,
        recurrenceInterval: Number($('#t-recurrence-interval').value) || 1,
        recurrenceEndDate: $('#t-recurrence-end').value || null
      };
      if (!body.title) return toast(t('task_title_required'), 'error');
      if (!isNew) {
        await api(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast(t('task_saved'));
      } else {
        const { task: newTask } = await api(`/boards/${board.id}/tasks`, { method: 'POST', body: JSON.stringify({ ...body, columnId: Number($('#t-col').value) }) });
        toast(t('task_created'));
        if (activeTemplate?.checklists?.length) {
          for (const cl of activeTemplate.checklists) {
            const { checklist } = await api(`/tasks/${newTask.id}/checklists`, { method: 'POST', body: JSON.stringify({ title: cl.title }) });
            for (const itemTitle of cl.items || []) {
              await api(`/tasks/${newTask.id}/checklists/${checklist.id}/items`, { method: 'POST', body: JSON.stringify({ title: itemTitle }) });
            }
          }
        }
      }
      closeModal();
      router();
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#t-delete')?.addEventListener('click', async () => {
    if (!confirm(t('task_delete_confirm'))) return;
    await api(`/tasks/${taskId}`, { method: 'DELETE' });
    toast(t('task_deleted'));
    closeModal();
    router();
  });
}

/* ---------------- Task detail ---------------- */
async function renderTask(main, { id }) {
  const taskId = Number(id);
  const data = await api(`/tasks/${taskId}`);
  const { task, checklists, checklistItems, comments, board, columns, members, myRole } = data;
  const canEdit = ['owner', 'admin', 'member'].includes(myRole) || state.user.role === 'admin';
  const itemsByCl = {};
  (checklistItems || []).forEach((i) => { (itemsByCl[i.checklist_id] = itemsByCl[i.checklist_id] || []).push(i); });
  const allDone = (cl) => (itemsByCl[cl.id] || []).length > 0 && (itemsByCl[cl.id] || []).every((i) => i.is_done);

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('clipboard', 22)} ${t('task_has')}${task.id} <span class="sub">📂 ${esc(board.projectName)} · ${esc(board.name)}</span></div>
      <div class="page-actions">
        <button class="btn-ghost" data-nav="#/board/${board.id}">${icon('arrowBack', 16)} ${t('back_to_board')}</button>
        ${canEdit ? `<button class="btn-primary" id="task-edit">${icon('edit', 16)} ${t('edit')}</button>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-body task-detail">
        <div class="td-title">${esc(task.title)}</div>
        <div class="td-row td-row-tags">${priorityChip(task.priority)}
          ${task.recurrence_rule && task.recurrence_rule !== 'none' ? `<span class="tag-chip">🔁 ${t('recurrence_' + task.recurrence_rule)}${task.recurrence_interval > 1 ? ' ×' + task.recurrence_interval : ''}</span>` : ''}
          ${task.tags?.map((t) => `<span class="tag-chip">${esc(t.name)}</span>`).join('') || ''}
        </div>
        <div class="td-fields">
          <span class="td-field"><span class="td-label">${t('column_label')}</span><span class="column-badge" style="--col:${esc(task.column_color || '#e2e8f0')}">${esc(task.column_name)}</span></span>
          <span class="td-field"><span class="td-label">${t('deadline')}</span><span>${task.due_date ? fmtDate(task.due_date) : '—'}</span></span>
          <span class="td-field"><span class="td-label">${t('assigned')}</span><span>${task.assignee_id ? avatarHTML({ fullName: task.assignee_name, username: task.assignee_username, avatarColor: task.assignee_color, avatarUrl: task.assignee_avatar_url }, 24) + ' ' + esc(task.assignee_name || task.assignee_username) : '—'}</span></span>
        </div>
        ${task.description ? `<div style="margin:14px 0 4px"><span class="td-label">${t('description')}</span></div><div class="td-desc">${renderMarkdown(task.description)}</div>` : ''}
        <div style="margin-top:16px;font-size:12px;color:var(--ink3)">
          ${t('created_by')} ${esc(task.creator_name || task.creator_username || `#${task.created_by}`)} ${t('created_on')} ${fmtDate(task.created_at)}${task.updated_at ? ` · ${t('modified')} ${timeAgo(task.updated_at)}` : ''}
        </div>
      </div>
    </div>

    ${(checklists || []).length ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title">${icon('check', 16)} ${t('checklists')}</span> <span class="card-count">${checklists.filter(allDone).length}/${checklists.length} ${t('done_count')}</span></div>
      <div class="card-body">
        ${checklists.map((cl) => {
          const its = itemsByCl[cl.id] || [];
          const done = its.filter((i) => i.is_done).length;
          return `
          <div class="checklist-block" data-cl="${cl.id}">
            <div class="checklist-title">
              <strong>${esc(cl.title)}</strong>
              <span style="font-size:12px;color:var(--ink2)">${done}/${its.length}</span>
              ${canEdit ? `<button class="btn-ghost btn-sm" data-cldel="${cl.id}" style="margin-left:auto">${icon('trash', 13)}</button>` : ''}
            </div>
            <div class="checklist-items">
              ${its.map((i) => `
                <label class="checklist-item ${i.is_done ? 'done' : ''}">
                  ${canEdit
                    ? `<input type="checkbox" data-item="${i.id}" ${i.is_done ? 'checked' : ''} />`
                    : `<span class="checkbox-static">${i.is_done ? '☑' : '☐'}</span>`}
                  <span class="ci-title">${esc(i.title)}</span>
                  ${canEdit ? `<button class="btn-ghost btn-sm" data-itemdel="${i.id}" style="margin-left:auto;padding:2px 6px">${icon('trash', 13)}</button>` : ''}
                </label>`).join('')}
            </div>
            ${canEdit ? `
            <div class="checklist-add">
              <input data-cladd="${cl.id}" placeholder="${t('new_item')}" />
              <button class="btn-primary btn-sm" data-claddbtn="${cl.id}">${icon('plus', 14)}</button>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    ${canEdit ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title">${icon('list', 16)} ${t('checklist_add')}</span></div>
      <div class="card-body">
        <div class="checklist-add">
          <input id="cl-new-name" placeholder="${t('checklist_new_name')}" autocomplete="off" />
          <button class="btn-primary" id="cl-new-btn">${icon('plus', 16)} ${t('add')}</button>
        </div>
      </div>
    </div>` : ''}

    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title">${icon('comment', 16)} ${t('comments')}</span> <span class="card-count">${comments.length}</span></div>
      <div class="card-body">
        <div class="comment-list" id="comment-list">
          ${comments.map((c) => `
            <div class="comment" data-cid="${c.id}">
              ${avatarHTML({ fullName: c.full_name, username: c.username, avatarColor: c.avatar_color, avatarUrl: c.avatar_url }, 28)}
              <div class="c-body">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span class="c-author">${esc(c.full_name || c.username)}</span>
                  <span style="display:flex;gap:8px;align-items:center">
                    <span class="c-time">${timeAgo(c.created_at)}</span>
                    ${(c.user_id === state.user.id || myRole === 'admin') ? `<button class="c-delete" data-del="${c.id}" title="${t('delete')}">${icon('trash', 13)}</button>` : ''}
                  </span>
                </div>
                <div class="c-text">${renderMarkdown(c.body).replace(/@([a-zA-Z0-9_.]+)/g, (m, u) => `<span class="mention">${esc(m)}</span>`)}</div>
              </div>
            </div>`).join('') || `<div style="color:var(--ink3);font-size:14px">${t('no_comments')}</div>`}
        </div>
        <div style="margin-top:16px">
          <label>${t('comments')} ${t('add')}</label>
          <textarea id="comment-body" rows="2" placeholder="${t('comment_placeholder')}"></textarea>
          <div style="margin-top:8px;display:flex;justify-content:flex-end">
            <button class="btn-primary" id="comment-send">${t('send')}</button>
          </div>
        </div>
      </div>
    </div>`;

  $('#task-edit')?.addEventListener('click', async () => {
    const boardData = await api(`/boards/${board.id}`);
    showTaskModal(boardData.board, boardData.columns, boardData.members, { ...task, tags: task.tags });
  });
  $('#comment-send').addEventListener('click', async () => {
    const body = $('#comment-body').value.trim();
    if (!body) return toast(t('comment_empty'), 'error');
    await api(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
    $('#comment-body').value = '';
    toast(t('comment_sent'));
    renderTask(main, { id });
  });
  setupMentionAutocomplete($('#comment-body'), members);
  $$('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(t('comment_delete_confirm'))) return;
    await api(`/tasks/comments/${b.dataset.del}`, { method: 'DELETE' });
    toast(t('comment_deleted'));
    renderTask(main, { id });
  }));

  // Checklist-handlers
  $('#cl-new-btn')?.addEventListener('click', async () => {
    const title = $('#cl-new-name').value.trim();
    if (!title) return toast(t('checklist_name_required'), 'error');
    await api(`/tasks/${taskId}/checklists`, { method: 'POST', body: JSON.stringify({ title }) });
    toast(t('checklist_created'));
    renderTask(main, { id });
  });
  $$('[data-claddbtn]').forEach((b) => b.addEventListener('click', async () => {
    const clId = Number(b.dataset.claddbtn);
    const input = $(`[data-cladd="${clId}"]`);
    const title = input.value.trim();
    if (!title) return toast(t('item_title_required'), 'error');
    await api(`/tasks/${taskId}/checklists/${clId}/items`, { method: 'POST', body: JSON.stringify({ title }) });
    input.value = '';
    renderTask(main, { id });
  }));
  $$('[data-item]').forEach((c) => c.addEventListener('change', async () => {
    await api(`/tasks/${taskId}/items/${c.dataset.item}`, { method: 'PATCH', body: JSON.stringify({ isDone: c.checked }) });
    renderTask(main, { id });
  }));
  $$('[data-itemdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(t('item_delete_confirm'))) return;
    await api(`/tasks/${taskId}/items/${b.dataset.itemdel}`, { method: 'DELETE' });
    renderTask(main, { id });
  }));
  $$('[data-cldel]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(t('checklist_delete_confirm'))) return;
    await api(`/tasks/${taskId}/checklists/${b.dataset.cldel}`, { method: 'DELETE' });
    renderTask(main, { id });
  }));
}

/* ---------------- @mentions autocomplete ---------------- */
function setupMentionAutocomplete(textarea, members) {
  let wrap = document.getElementById('mention-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'mention-wrap';
    wrap.className = 'mention-wrap hidden';
    document.body.appendChild(wrap);
  }
  const candidates = (members || []).filter((m) => m.username);
  let list = [];
  let index = 0;

  const insertMention = () => {
    const user = list[index];
    if (!user) return;
    const pos = textarea.selectionStart;
    const m = textarea.value.slice(0, pos).match(/@([a-zA-Z0-9_.]*)$/);
    const start = pos - (m ? m[0].length : 0);
    textarea.value = textarea.value.slice(0, start) + '@' + user.username + ' ' + textarea.value.slice(pos);
    textarea.focus();
    const newPos = start + user.username.length + 1;
    textarea.setSelectionRange(newPos, newPos);
    wrap.classList.add('hidden');
  };

  const renderMentions = () => {
    const rect = textarea.getBoundingClientRect();
    wrap.style.top = Math.max(8, rect.top - 8) + 'px';
    wrap.style.left = rect.left + 'px';
    wrap.innerHTML = list.map((u, i) => `
      <button class="mention-item ${i === index ? 'selected' : ''}" data-idx="${i}" type="button">
        ${avatarHTML(u, 22)} <span>${esc(u.fullName || u.username)}</span> <span class="mention-user">@${esc(u.username)}</span>
      </button>`).join('');
    wrap.classList.remove('hidden');
    $$('.mention-item', wrap).forEach((b) => b.addEventListener('mousedown', (e) => {
      e.preventDefault();
      index = Number(b.dataset.idx);
      insertMention();
    }));
  };

  textarea.addEventListener('input', () => {
    const m = textarea.value.slice(0, textarea.selectionStart).match(/@([a-zA-Z0-9_.]*)$/);
    if (m) {
      const q = m[1].toLowerCase();
      list = candidates.filter((u) => u.username.toLowerCase().includes(q)).slice(0, 8);
      if (list.length) { index = 0; renderMentions(); }
      else wrap.classList.add('hidden');
    } else {
      wrap.classList.add('hidden');
    }
  });

  textarea.addEventListener('keydown', (e) => {
    if (wrap.classList.contains('hidden')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); index = Math.min(index + 1, list.length - 1); renderMentions(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); index = Math.max(index - 1, 0); renderMentions(); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(); }
    else if (e.key === 'Escape') wrap.classList.add('hidden');
  });

  textarea.addEventListener('blur', () => setTimeout(() => wrap.classList.add('hidden'), 150));
}

/* ---------------- Settings ---------------- */
async function renderSettings(main) {
  const u = state.user;
  main.innerHTML = `
    <div class="page-header"><div class="page-title">${icon('settings', 22)} ${t('settings')}</div></div>
    <div class="card" style="max-width:520px">
      <div class="card-header"><span class="card-title">${icon('user', 16)} ${t('profile')}</span></div>
      <div class="card-body">
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px">
          <div class="avatar-upload ${u.avatarUrl || u.avatar_url ? '' : 'empty'}" id="avatar-upload" title="${t('avatar_upload_hint')}">
            <span class="avatar-preview-wrap">
              ${u.avatarUrl || u.avatar_url ? `<img id="avatar-preview" class="avatar-preview" src="${esc(u.avatarUrl || u.avatar_url)}" alt="Avatar" />` : avatarHTML(u, 80)}
            </span>
            <label class="avatar-upload-label" id="avatar-upload-label">${icon('camera', 22)}</label>
            <input type="file" id="avatar-file" accept="image/*" style="display:none" />
          </div>
          <div>
            <div style="font-weight:700;font-size:16px">${esc(u.fullName || u.username)}</div>
            <div style="color:var(--ink2);font-size:13px">${esc(u.email)}</div>
            <div style="font-size:12px;color:var(--ink3);margin-top:4px">${t('avatar_upload_hint')}</div>
          </div>
        </div>
        <label>${t('full_name')}</label>
        <input id="s-name" value="${esc(u.fullName || '')}" autocomplete="name" />
        <label>${t('avatar_color')}</label>
        <input id="s-color" type="color" value="${esc(u.avatarColor || '#4f46e5')}" style="width:80px;height:36px;padding:2px" />
        <label>${t('change_password')}</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <input id="s-cur" type="password" placeholder="${t('current_password')}" autocomplete="current-password" />
          <input id="s-new" type="password" placeholder="${t('new_password')}" autocomplete="new-password" />
        </div>
        <label>${t('language')}</label>
        <select id="s-lang">
          <option value="nl" ${state.lang === 'nl' ? 'selected' : ''}>Nederlands</option>
          <option value="en" ${state.lang === 'en' ? 'selected' : ''}>English</option>
        </select>
        <p style="font-size:12px;color:var(--ink2);margin-top:6px">${t('language_hint')}</p>
        <div class="modal-actions">
          <button class="btn-primary" id="s-save">${icon('check', 16)} ${t('save')}</button>
        </div>
      </div>
    </div>
    <div class="card" style="max-width:520px;margin-top:20px">
      <div class="card-header"><span class="card-title">${icon('bell', 16)} ${t('notif_prefs')}</span></div>
      <div class="card-body">
        <p style="font-size:12px;color:var(--ink2);margin-bottom:12px">${t('notif_prefs_hint')}</p>
        <div id="notif-prefs-list"><div style="color:var(--ink3);font-size:13px">…</div></div>
      </div>
    </div>`;

  const avatarUpload = $('#avatar-upload');
  const avatarFile = $('#avatar-file');
  const avatarLabel = $('#avatar-upload-label');

  avatarLabel.addEventListener('click', () => avatarFile.click());

  avatarFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast(t('avatar_only_images'), 'error');
    if (file.size > 2 * 1024 * 1024) return toast(t('avatar_max_size'), 'error');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: { Authorization: `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiError(data.error || t('avatar_upload_fail')));

      state.user.avatar_url = data.avatar_url;
      state.user.avatarUrl = data.avatar_url;
      localStorage.setItem('mb_user', JSON.stringify(state.user));
      renderTopbar();
      toast(t('avatar_updated'));
      router();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  $('#s-lang').addEventListener('change', (e) => {
    setLang(e.target.value);
    toast(t('saved'));
    router();
  });

  $('#s-save').addEventListener('click', async () => {
    try {
      const body = { fullName: $('#s-name').value, avatarColor: $('#s-color').value };
      if ($('#s-new').value) {
        if (!$('#s-cur').value) return toast(t('current_password_required'), 'error');
        body.currentPassword = $('#s-cur').value;
        body.password = $('#s-new').value;
      }
      const { user } = await api('/users/me', { method: 'PATCH', body: JSON.stringify(body) });
      setSession(state.token, user);
      localStorage.setItem('mb_user', JSON.stringify(user));
      invalidateOverview();
      renderTopbar();
      toast(t('profile_saved'));
      router();
    } catch (e) { toast(apiError(e.message), 'error'); }
  });

  api('/notifications/prefs').then(({ prefs }) => {
    const labels = { assignment: t('notif_type_assignment'), comment: t('notif_type_comment'), mention: t('notif_type_mention'), info: t('notif_type_info') };
    $('#notif-prefs-list').innerHTML = Object.keys(labels).map((k) => `
      <label class="pref-row" style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer">
        <input type="checkbox" data-pref="${k}" ${prefs[k] ? 'checked' : ''} />
        <span>${labels[k]}</span>
      </label>`).join('');
    $$('[data-pref]').forEach((cb) => cb.addEventListener('change', async () => {
      const body = {};
      $$('[data-pref]').forEach((c) => { body[c.dataset.pref] = c.checked; });
      try {
        await api('/notifications/prefs', { method: 'PATCH', body: JSON.stringify(body) });
        toast(t('saved'));
      } catch (e) { toast(apiError(e.message), 'error'); }
    }));
  }).catch(() => {});
}

/* ---------------- Admin ---------------- */
async function renderAdmin(main) {
  if (state.user.role !== 'admin') {
    main.innerHTML = `<div class="empty-state"><div class="big">🔒</div>${t('no_access')}</div>`;
    return;
  }
  const [stats, users, orgs] = await Promise.all([api('/admin/stats'), api('/admin/users'), api('/admin/orgs')]);
  main.innerHTML = `
    <div class="page-header"><div class="page-title">${icon('shield', 22)} ${t('admin_panel')}</div></div>
    <div class="stat-grid">
      <div class="stat-card"><span class="stat-icon stat-icon-purple">${icon('user', 20)}</span><div class="stat-value">${stats.totals.users}</div><div class="stat-label">${t('users')}</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-blue">${icon('org', 20)}</span><div class="stat-value">${stats.totals.orgs}</div><div class="stat-label">${t('organizations')}</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-green">${icon('project', 20)}</span><div class="stat-value">${stats.totals.projects}</div><div class="stat-label">${t('projects')}</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-amber">${icon('clipboard', 20)}</span><div class="stat-value">${stats.totals.tasks}</div><div class="stat-label">${t('task').toLowerCase()}s</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-blue">${icon('comment', 20)}</span><div class="stat-value">${stats.totals.comments}</div><div class="stat-label">${t('comments')}</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-green">${icon('activity', 20)}</span><div class="stat-value">${stats.newUsers7d}</div><div class="stat-label">${t('new_users_7d')}</div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">${icon('user', 16)} ${t('users')}</span></div>
      <div class="card-body" style="padding:0;overflow-x:auto">
        <table class="admin-table">
          <thead><tr><th>${t('user')}</th><th>${t('email')}</th><th>${t('role')}</th><th>${t('status')}</th><th>${t('org')}</th><th>${t('task').toLowerCase()}s</th><th>${t('created')}</th><th></th></tr></thead>
          <tbody>
            ${users.users.map((u) => `
              <tr data-uid="${u.id}">
                <td>${avatarHTML(u, 26)} ${esc(u.full_name || u.username)}</td>
                <td data-label="${t('email')}" style="color:var(--ink2)">${esc(u.email)}</td>
                <td data-label="${t('role')}">
                  <select class="role-select" data-role="${u.id}">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>user</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                  </select>
                </td>
                <td data-label="${t('status')}"><span class="status-pill status-${esc(u.status)}">${esc(u.status)}</span></td>
                <td data-label="${t('org')}">${u.org_count}</td>
                <td data-label="${t('task').toLowerCase()}s">${u.task_count}</td>
                <td data-label="${t('created')}" style="color:var(--ink2)">${fmtDate(u.created_at)}</td>
                <td data-label="${t('action')}">
                  ${u.id !== state.user.id ? `<button class="btn-ghost btn-sm" data-status="${u.id}">${u.status === 'active' ? t('disable') : t('activate')}</button>` : `<span style="color:var(--ink3)">${t('you')}</span>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">${icon('org', 16)} ${t('top_orgs')}</span></div>
      <div class="card-body" style="padding:0">
        <table class="admin-table">
          <thead><tr><th>${t('organizations')}</th><th>${t('members')}</th><th>${t('projects')}</th><th>${t('task').toLowerCase()}s</th></tr></thead>
          <tbody>
            ${stats.topOrgs.map((o) => `
              <tr><td style="font-weight:600">${esc(o.name)}</td><td data-label="${t('members')}">${o.members}</td><td data-label="${t('projects')}">${o.projects}</td><td data-label="${t('task').toLowerCase()}s">${o.tasks}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  $$('[data-role]').forEach((sel) => sel.addEventListener('change', async () => {
    await api(`/users/${sel.dataset.role}`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) });
    toast(t('role_updated'));
  }));
  $$('[data-status]').forEach((b) => b.addEventListener('click', async () => {
    const uid = b.dataset.status;
    const target = users.users.find((u) => u.id === Number(uid));
    const newStatus = target.status === 'active' ? 'disabled' : 'active';
    await api(`/users/${uid}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    toast(`${t('user')} ${newStatus === 'disabled' ? t('disabled') : t('enabled')}`);
    renderAdmin(main);
  }));
}

/* ---------------- Invitation accept ---------------- */
async function renderAccept(main, { id }) {
  const token = id;
  main.innerHTML = `<div class="empty-state"><div class="big">✉️</div>${t('invitation_accepting')}</div>`;
  try {
    const r = await api(`/invitations/${token}/accept`, { method: 'POST' });
    toast(`${t('welcome_org')} ${r.orgName}!`);
    invalidateOverview();
    await loadOverview();
    location.hash = `#/org/${r.orgId}`;
  } catch (e) {
    main.innerHTML = `<div class="empty-state"><div class="big">⚠️</div>${esc(apiError(e.message))}<br><br><a href="#/dashboard" class="btn-primary" style="text-decoration:none;display:inline-block">${t('go_dashboard')}</a></div>`;
  }
}

/* ---------------- Events & init ---------------- */
// Auto-herladen bij een nieuwe versie: geen handmatig cache/cookies wissen meer nodig.
function watchVersion() {
  let last = null;
  const check = async () => {
    try {
      const { version } = await fetch(API + '/version').then((r) => r.json());
      if (last && version !== last) { location.reload(); return; }
      last = version;
    } catch (e) { /* negeer tijdelijke netwerkfouten */ }
  };
  check();
  setInterval(check, 45000);
}

function init() {
  // Taal toepassen op statische elementen
  document.documentElement.lang = state.lang === 'en' ? 'en' : 'nl';
  translateStatic();

  // auth tabs
  $$('.auth-tab').forEach((b) => b.addEventListener('click', () => renderAuthTab(b.dataset.tab)));
  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#li-error').textContent = '';
    try {
      const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#li-email').value, password: $('#li-password').value }) });
      setSession(d.token, d.user);
      showApp();
      router();
    } catch (err) { $('#li-error').textContent = err.message; }
  });
  $('#form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#rg-error').textContent = '';
    try {
      const d = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: $('#rg-email').value,
          username: $('#rg-username').value,
          fullName: $('#rg-fullname').value || undefined,
          password: $('#rg-password').value
        })
      });
      setSession(d.token, d.user);
      showApp();
      router();
    } catch (err) { $('#rg-error').textContent = err.message; }
  });

  // sidebar / topbar (event-delegatie: werkt ook voor later ingeladen items)
  setTheme(state.theme);
  $('#btn-sidebar').addEventListener('click', () => toggleSidebar());
  $('#btn-theme').addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  // Globale navigatie-delegatie: dekt sidebar, main-content en de user-dropdown
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      location.hash = nav.dataset.nav;
      $('#user-dropdown').classList.add('hidden');
      $('#notif-panel').classList.add('hidden');
    }
  });
  $('#btn-user').addEventListener('click', (e) => { e.stopPropagation(); $('#user-dropdown').classList.toggle('hidden'); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) $('#user-dropdown').classList.add('hidden');
    if (!e.target.closest('.topbar-right')) $('#notif-panel').classList.add('hidden');
  });
  $('#btn-notifications').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#notif-panel').classList.toggle('hidden');
    loadNotifications();
  });
  $('#btn-read-all').addEventListener('click', async () => {
    await api('/notifications/read-all', { method: 'POST' });
    loadNotifications();
  });
  $('#btn-new-org').addEventListener('click', () => showOrgModal());

  // Sidebar backdrop click to close
  $('#sidebar-backdrop').addEventListener('click', closeSidebar);

  // Swipe gestures for sidebar on mobile
  let touchStartX = 0;
  let touchStartY = 0;
  let isSidebarOpen = false;
  const sidebar = $('#sidebar');
  const backdrop = $('#sidebar-backdrop');

  document.addEventListener('touchstart', (e) => {
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (!mobile) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSidebarOpen = sidebar.classList.contains('open');
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (!mobile) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      if (!isSidebarOpen && deltaX > 0 && touchStartX < 30) {
        // Swipe from left edge to open
        sidebar.style.transform = `translateX(${Math.min(deltaX, 240)}px)`;
      } else if (isSidebarOpen && deltaX < 0) {
        // Swipe left to close
        sidebar.style.transform = `translateX(${Math.max(240 + deltaX, 0)}px)`;
        const opacity = Math.max(1 + deltaX / 240, 0);
        backdrop.style.opacity = opacity;
        backdrop.style.visibility = opacity > 0 ? 'visible' : 'hidden';
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (!mobile) return;
    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX;

    sidebar.style.transform = '';
    backdrop.style.opacity = '';
    backdrop.style.visibility = '';

    if (!isSidebarOpen && deltaX > 80 && touchStartX < 30) {
      toggleSidebar();
    } else if (isSidebarOpen && deltaX < -80) {
      closeSidebar();
    }
  }, { passive: true });

  // search
  let searchTimer;
  $('#search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { $('#search-results').classList.add('hidden'); return; }
    searchTimer = setTimeout(async () => {
      try {
        const d = await api(`/search?q=${encodeURIComponent(q)}`);
        renderSearchResults(d, q);
      } catch (err) { /* negeer */ }
    }, 250);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) $('#search-results').classList.add('hidden');
  });

  window.addEventListener('hashchange', router);

  if (state.token) {
    showApp();
    router();
  } else {
    showAuth();
  }

  watchVersion();
}

function renderSearchResults(d, q) {
  const box = $('#search-results');
  const taskItems = d.tasks.map((t) => `
    <button class="search-item" data-nav="#/task/${t.id}">
      <span class="s-ic">${icon('clipboard', 16)}</span>
      <span><span>${esc(t.title)}</span><div class="sub">${esc(t.project_name)} · ${esc(t.column_name)}</div></span>
    </button>`).join('');
  const projItems = d.projects.map((p) => `
    <button class="search-item" data-nav="#/project/${p.id}">
      <span class="s-ic">${icon('project', 16)}</span>
      <span><span>${esc(p.name)}</span><div class="sub">${esc(p.org_name)}</div></span>
    </button>`).join('');

  box.innerHTML = `
    ${taskItems ? `<div class="search-group-title">${t('task').toLowerCase()}s</div>${taskItems}` : ''}
    ${projItems ? `<div class="search-group-title">${t('projects')}</div>${projItems}` : ''}
    ${!taskItems && !projItems ? `<div class="search-item" style="color:var(--ink3)">${t('noData')} voor "${esc(q)}"</div>` : ''}`;
  box.classList.remove('hidden');
  $$('#search-results [data-nav]').forEach((b) => b.addEventListener('click', () => {
    location.hash = b.dataset.nav;
    box.classList.add('hidden');
    $('#search-input').value = '';
  }));
}

// expose for inline onclick handlers in modals
window.closeModal = closeModal;
window.toast = toast;

document.addEventListener('DOMContentLoaded', init);