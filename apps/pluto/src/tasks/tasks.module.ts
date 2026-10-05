import { Module } from "@nestjs/common";
import { FoldersModule } from "../folders/folders.module.js";
import {
  FolderTasksController,
  TasksController,
} from "./tasks.controller.js";
import { TasksService } from "./tasks.service.js";

@Module({
  imports: [FoldersModule],
  controllers: [FolderTasksController, TasksController],
  providers: [TasksService],
})
export class TasksModule {}
