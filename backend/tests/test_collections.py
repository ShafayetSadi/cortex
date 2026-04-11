import asyncio
import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models import Collection, Document, User, Workspace
from app.routers.collections import delete_collection
from app.routers.documents import resolve_collection_id, update_document


class CollectionWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

        self.workspace = Workspace(name="Workspace One", slug="workspace-one")
        self.other_workspace = Workspace(name="Workspace Two", slug="workspace-two")
        self.db.add_all([self.workspace, self.other_workspace])
        self.db.flush()

        self.user = User(
            name="User One",
            email="user-one@example.com",
            password="hash",
            role="admin",
            workspace_id=self.workspace.id,
        )
        self.other_user = User(
            name="User Two",
            email="user-two@example.com",
            password="hash",
            role="admin",
            workspace_id=self.other_workspace.id,
        )
        self.db.add_all([self.user, self.other_user])
        self.db.flush()

        self.collection = Collection(
            name="Product",
            workspace_id=self.workspace.id,
            created_by=self.user.id,
        )
        self.other_collection = Collection(
            name="Private",
            workspace_id=self.other_workspace.id,
            created_by=self.other_user.id,
        )
        self.db.add_all([self.collection, self.other_collection])
        self.db.flush()

        self.document = Document(
            title="Spec",
            description="Spec content",
            file_data=b"pdf",
            workspace_id=self.workspace.id,
            created_by=self.user.id,
            collection_id=self.collection.id,
        )
        self.db.add(self.document)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_resolve_collection_rejects_other_workspace_collection(self):
        with self.assertRaises(HTTPException) as exc:
            resolve_collection_id(str(self.other_collection.id), self.user, self.db)

        self.assertEqual(exc.exception.status_code, 404)

    def test_update_document_can_clear_collection(self):
        updated = asyncio.run(
            update_document(
                self.document.id,
                title=None,
                file=None,
                collection_id="",
                current_user=self.user,
                db=self.db,
            )
        )

        self.assertIsNone(updated.collection_id)
        self.db.refresh(self.document)
        self.assertIsNone(self.document.collection_id)

    def test_update_document_rejects_collection_from_another_workspace(self):
        with self.assertRaises(HTTPException) as exc:
            asyncio.run(
                update_document(
                    self.document.id,
                    title=None,
                    file=None,
                    collection_id=str(self.other_collection.id),
                    current_user=self.user,
                    db=self.db,
                )
            )

        self.assertEqual(exc.exception.status_code, 404)
        self.db.refresh(self.document)
        self.assertEqual(self.document.collection_id, self.collection.id)

    def test_delete_collection_unassigns_documents_without_deleting_them(self):
        delete_collection(self.collection.id, current_user=self.user, db=self.db)

        remaining = self.db.get(Document, self.document.id)
        self.assertIsNotNone(remaining)
        self.assertIsNone(remaining.collection_id)
        self.assertIsNone(self.db.get(Collection, self.collection.id))


if __name__ == "__main__":
    unittest.main()
