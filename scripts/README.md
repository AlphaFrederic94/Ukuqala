# CareAI Scripts

This directory contains various utility scripts for the CareAI project.

## Directory Structure

- `database/` - Database setup and migration scripts
- `deployment/` - Deployment scripts
- `utils/` - Utility scripts

## Available Scripts

### Project Organization

- `organize_project.sh` - Script to organize the project directory structure

### Database

- Database setup scripts
- Migration scripts
- Backup scripts

### Deployment

- Deployment scripts for various environments
- Build scripts

### Utils

- Utility scripts for development
- Code generation scripts
- Testing scripts

## Usage

Most scripts can be run directly from the command line:

```bash
# Make script executable if needed
chmod +x scripts/script_name.sh

# Run the script
./scripts/script_name.sh
```

For JavaScript scripts:

```bash
node scripts/script_name.js
```

## Adding New Scripts

When adding new scripts:

1. Place them in the appropriate subdirectory
2. Make them executable if they are shell scripts (`chmod +x script_name.sh`)
3. Add documentation in this README file
4. Include usage examples and required parameters
