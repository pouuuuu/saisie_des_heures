import pypyodbc
import pyodbc
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# SQL statements
create_suiviop = "CREATE TABLE IF NOT EXISTS SUIVIOP_TAMPON (ID_SUIVIOP INTEGER PRIMARY KEY, DATEINTER VARCHAR(50), NOMOP VARCHAR(255), TYPE_CHANTIER VARCHAR(50), NBRHEURE NUMERIC)"
insert_suiviop = "INSERT INTO SUIVIOP_TAMPON (ID_SUIVIOP, DATEINTER, NOMOP, TYPE_CHANTIER, NBRHEURE) VALUES (?,?,?,?,?)"
select_suiviop = "SELECT ID_SUIVIOP, DATEINTER, NOMOP, TYPE_CHANTIER, NBRHEURE FROM SUIVIOP"


def connect_hf(db: str, uid: str, passwd: str):
    conn_str = (
        "Driver={HFSQL};"
        "Server Name=localhost;"
        "Server Port=4900;"
        f"Database={db};"
        f"UID={uid};"
        f"PWD={passwd};"
    )
    return pypyodbc.connect(conn_str)


def connect_pg(db: str, uid: str, passwd: str):
    conn_str = (
        "Driver={PostgreSQL Unicode};"
        "Server=localhost;"
        "Port=5432;"
        f"Database={db};"
        f"UID={uid};"
        f"PWD={passwd};"
    )
    return pyodbc.connect(conn_str)


def create_table(conn_pg, req: str):
    cursor = conn_pg.cursor()
    cursor.execute(req)
    conn_pg.commit()


def clear_table(conn_pg, table: str):
    cursor = conn_pg.cursor()
    cursor.execute(f"TRUNCATE TABLE {table}_TAMPON")
    conn_pg.commit()


def get_row(conn_hf, req: str):
    cursor = conn_hf.cursor()
    cursor.execute(req)
    return cursor.fetchall()


def insert_row(conn_pg, conn_hf, req_pg: str, req: str):
    cursor_pg = conn_pg.cursor()
    cursor_hf = conn_hf.cursor()

    cursor_hf.execute(req)
    resultats = [dict(zip([column[0] for column in cursor_hf.description], row)) for row in cursor_hf.fetchall()]
    for key in resultats:
        value = []
        for val in key.values():
            value.append(val)
        try:
            cursor_pg.execute(req_pg, value)
            conn_pg.commit()
        except Exception as e:
            print('insert_row erreur:', e)


def main():
    try:
        conn_pg = connect_pg("postgres", "postgres", "postgre")
        conn_hf = connect_hf("APPLI", "admin", "")

        create_table(conn_pg, create_suiviop)

        clear_table(conn_pg, 'SUIVIOP')

        insert_row(conn_pg, conn_hf, insert_suiviop, select_suiviop)

    finally:
        try:
            conn_hf.close()
        except Exception:
            pass
        try:
            conn_pg.close()
        except Exception:
            pass


if __name__ == '__main__':
    main()


app = FastAPI(
    title="Mon API FastAPI",
    description="API created with FastAPI",
    version="1.0.0"
)

origins = [
    "http://localhost:63342",
    "http://127.0.0.1:63342",
    "http://localhost:63343",
    "http://127.0.0.1:63343",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8000",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


@app.get("/suiviop/")
async def get_all_suiviop():
    conn_pg = connect_pg("postgres", "postgres", "postgre")
    cursor_pg = conn_pg.cursor()
    cursor_pg.execute("SELECT ID_SUIVIOP, DATEINTER, NOMOP,TYPE_CHANTIER, NBRHEURE FROM SUIVIOP_TAMPON")
    resultats = [dict(zip([column[0] for column in cursor_pg.description], row)) for row in cursor_pg.fetchall()]
    conn_pg.close()
    return resultats


@app.get("/suiviop/{dateinter}")
async def get_suiviop_by_date(dateinter: str):
    conn_pg = connect_pg("postgres", "postgres", "postgre")
    cursor_pg = conn_pg.cursor()
    cursor_pg.execute("SELECT ID_SUIVIOP, DATEINTER, NOMOP,TYPE_CHANTIER, NBRHEURE FROM SUIVIOP_TAMPON WHERE DATEINTER = ?", (dateinter,))
    resultats = [dict(zip([column[0] for column in cursor_pg.description], row)) for row in cursor_pg.fetchall()]
    conn_pg.close()
    return resultats


@app.post("/suiviop/{id_suiviop}/{dateinter}/{nomop}/{type_chantier}/{document}/{nbrheure}")
async def add_suiviop(id_suiviop: int, dateinter: str, nomop: str, type_chantier: str, document: str, nbrheure: float):
    conn_pg = connect_pg("postgres", "postgres", "postgre")
    cursor_pg = conn_pg.cursor()
    try:
        import urllib.parse
        nomop_dec = urllib.parse.unquote(nomop)
        type_dec = urllib.parse.unquote(type_chantier)
        document_dec = urllib.parse.unquote(document)
        cursor_pg.execute(insert_suiviop, (id_suiviop, dateinter, nomop_dec, type_dec, nbrheure))
        conn_pg.commit()
    except Exception as e:
        print('add_suiviop erreur:', e)
        try:
            conn_pg.close()
        except Exception:
            pass
        return {"error": str(e)}
    conn_pg.close()
    return {"message": "SuiviOP added successfully"}
