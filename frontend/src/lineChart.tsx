"use client"


import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

export type LineDataPoint = {
	label: string
	passRate: number
}

export function InteractiveChart({
									 lineData,
									 courseName,
									 courseId,
								 }: {
	lineData: LineDataPoint[]
	courseName: string
	courseId: string
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Dot Plot - Pass Rate</CardTitle>
				<CardDescription>Showing the pass rate for {courseName} {courseId}</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart
						// accessibilityLayer
						// width={1100}
						// height={300}
						data={lineData}
						margin={{
							top: 20,
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false}/>
						<XAxis
							dataKey="label"
							tickLine={false}
							axisLine={false}
							tick={false}
							// tickFormatter={(value) => value.slice(0, 3)}
						/>
						<YAxis
							domain={[0, 100]}
							ticks={[0, 20, 40, 60, 80, 100]}
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						{/*<ChartTooltip*/}
						{/*	cursor={false}*/}
						{/*	content={<ChartTooltipContent indicator="line" />}*/}
						{/*/>*/}
						<Tooltip/>
						<Line
							dataKey="passRate"
							type="natural"
							stroke="var(--color-desktop)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-desktop)",
							}}
							activeDot={{
								r: 6,
							}}
						>
							{/*<LabelList*/}
							{/*	position="top"*/}
							{/*	offset={12}*/}
							{/*	className="fill-foreground"*/}
							{/*	fontSize={12}*/}
							{/*/>*/}
						</Line>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
			{/*<CardFooter className="flex-col items-start gap-2 text-sm">*/}
			{/*	<div className="flex gap-2 font-medium leading-none">*/}
			{/*		Pass rate per course section*/}
			{/*	</div>*/}
			{/*	<div className="leading-none text-muted-foreground">*/}
			{/*		Each label represents a unique course*/}
			{/*	</div>*/}
			{/*</CardFooter>*/}
		</Card>
	);
}
