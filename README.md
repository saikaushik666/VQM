# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

To run VQM
Download PGSQL from here --> https://www.postgresql.org/download/

First change directory to Backend
and follow these commands
create env if not h/ere
python -m venv venv


.\venv\scripts\activate


pip install -r requirements.txt

make migration
python manage.py makemigrations

python manage.py migrate

python manage.py runserver

create user
python manage.py createsuperuser

and then split the terminal and chnage directory to frontend
then type
npm install

npm run dev

you can see the website hosted in local host 

