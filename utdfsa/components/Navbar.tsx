export default function Navbar(){
    return(
        <nav className="flex justify-between items-center p-4">
            <a href="/"> UTD FSA </a>
            <ul className="flex gap-4">
                <li><a href="/Membership"> Membership </a></li>
                <li><a href="/Pamilya"> Pamilya </a></li>
                <li><a href="/Events"> Events </a></li>
                <li><a href="/Socials"> Socials </a></li>
            </ul>
        </nav>
    );
}