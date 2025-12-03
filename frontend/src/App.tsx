// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

//With help from ChatGPT
import './App.css'
import {Button} from "@/components/ui/button.tsx";
import CustomDropzone from "@/components/ui/CustomDropzone.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	// DialogDescription,
	// DialogFooter,
	DialogHeader,
	DialogTitle,
	// DialogTrigger,
} from "@/components/ui/dialog"
import {useState} from "react";
import {ScrollArea} from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function App() {
	const [nameAdd, setNameAdd] = useState("")
	const [nameRemove, setNameRemove] = useState("")
	const [fileUploaded, setFileUploaded] = useState(false)
	const [dialogMessage, setDialogMessage] = useState("")
	const [dialogOpen, setDialogOpen] = useState(false)
	const [dialogTitle, setDialogTitle] = useState("Error")
	const [fileContent, setFileContent] = useState<File | null>(null)

	const [tags, setTags] = useState<string[]>([])

	const handleAdd = async () => {
		if (!nameAdd.trim()) {
			setDialogTitle("Error");
			setDialogMessage("Please enter a name to add.");
			setDialogOpen(true);
			return;
		}
		if (!fileUploaded || !fileContent) {
			setDialogTitle("Error");
			setDialogMessage("Please upload a file.");
			setDialogOpen(true);
			return;
		}

		try {
			const response = await fetch(`http://localhost:4321/dataset/${nameAdd}/sections`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/zip'
				},
				body: fileContent,
			});

			const data = await response.json();

			if (response.ok) {
				setTags(data.result);
				setDialogTitle("Done!");
				setDialogMessage(`Your dataset now is ready!`);
			} else {
				setDialogTitle("Error");
				setDialogMessage(`Failed to add your dataset: ${data.error}`);
			}
		} catch (error) {
			setDialogTitle("Error");
			setDialogMessage(`Reason: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setDialogOpen(true);
		}
	};

	const handleRemove = async () => {
		if (!nameRemove.trim()) {
			setDialogTitle("Error");
			setDialogMessage("Please enter a name to remove.")
			setDialogOpen(true)
			return
		}
		try {
			const response = await fetch(`http://localhost:4321/dataset/${nameRemove}`, {
				method: 'DELETE'
			});

			const data = await response.json();

			if (response.ok) {
				setTags((prev) => prev.filter((tag) => tag !== nameRemove));
				setDialogTitle("Done!");
				setDialogMessage(`Dataset "${nameRemove}" removed successfully!`);
			} else {
				setDialogTitle("Error");
				setDialogMessage(`Failed to delete your dataset: ${data.error}`);
			}
		} catch (error) {
			setDialogTitle("Error");
			setDialogMessage(`Reason: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setDialogOpen(true);
		}
	}

	return (
	  <div>


	    <div className="w-full flex justify-center gap-5">
	      <Card className="w-[350px] hover:border-blue-500 transition-colors">
	        <CardHeader className={"text-left"}>
	          <CardTitle className={"text-xl"}>Add Dataset</CardTitle>
	          <CardDescription>Adding a Sections Dataset</CardDescription>
	        </CardHeader>
	        <CardContent>
	          <form>
	            <div className="grid w-full items-center gap-4">
	              <div className="flex flex-col space-y-1.5">
	                <Label htmlFor="name">Name</Label>
	                <Input
	                  id="name"
	                  placeholder="Name of your Sections"
	                  value={nameAdd}
	                  onChange={(e) => setNameAdd(e.target.value)}
	                />
	              </div>
	              <div className="p-8">
					  <CustomDropzone
						  onFileUpload={(file) => {
							  setFileUploaded(true)
							  setFileContent(file)
						  }}
					  />
	              </div>
	            </div>
	          </form>
	        </CardContent>
	        <CardFooter className="flex justify-end">
	          <Button onClick={handleAdd}>Add</Button>
	        </CardFooter>
	      </Card>


			<ScrollArea className="h-75 w-48 rounded-md border hover:border-blue-500 transition-colors">
				<div className="p-4">
					<h4 className="mb-4 text-sm font-medium leading-none text-l">Added Datasets</h4>
					{tags.map((tag) => (
						<>
							<div key={tag} className="text-sm">
								{tag}
							</div>
							<Separator className="my-2" />
						</>
					))}
				</div>
			</ScrollArea>

			<Card className="w-[350px] border hover:border-blue-500 transition-colors">
				<CardHeader className={"text-left"}>
					<CardTitle className={"text-xl"}>Remove Dataset</CardTitle>
					<CardDescription>Remove a Sections Dataset</CardDescription>
				</CardHeader>
				<CardContent>
					<form>
						<div className="grid w-full items-center gap-4">
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									placeholder="Name of your Sections"
									value={nameRemove}
									onChange={(e) => setNameRemove(e.target.value)}
								/>
							</div>
						</div>
					</form>
				</CardContent>
				<CardFooter className="flex justify-end">
					<Button variant="destructive" onClick={handleRemove}>Remove</Button>
				</CardFooter>
			</Card>



			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{dialogTitle}</DialogTitle>
					</DialogHeader>
					<p>{dialogMessage}</p>
				</DialogContent>
			</Dialog>
	    </div>

	  </div>
	)
}

export default App


